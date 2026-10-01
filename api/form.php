<?php
/**
 * Sibel Aydın Mimarlık — form uç noktası
 *
 *   POST /api/form.php   form_type=iletisim   (İletişim sayfası kısa formu)
 *                        form_type=proje      (Projenizi Anlatın — sayfa yapılınca bu dosyaya eklenecek)
 *
 * Yanıt: fetch ile (Accept: application/json) JSON; JS kapalıysa basit bir HTML sayfası.
 *   200 {ok:true, talep_no}      422 {ok:false, errors:{alan: mesaj}}
 *   429 çok sık gönderim          403 başka siteden gönderim       405 yalnızca POST
 *
 * Gönderim PHP mail() ile (cPanel). Talep no: SA-ILT-YIL-#### (yıl içinde sıralı, dosya kilidiyle).
 * Çalışma verisi (sayaç, hız sınırı) _data/ altında; klasör web'e kapalıdır (.htaccess + kök kural).
 * Test: SA_FORM_DRYRUN=1 → e-posta gönderilmez, _data/mail-dryrun.txt dosyasına yazılır.
 */
declare(strict_types=1);

date_default_timezone_set('Europe/Istanbul');

$CONFIG = [
    'to'          => 'proje@sibelaydinmimarlik.com.tr',
    'from'        => 'proje@sibelaydinmimarlik.com.tr',
    'from_name'   => 'Sibel Aydın Mimarlık',
    'data_dir'    => getenv('SA_FORM_DATA_DIR') ?: __DIR__ . '/_data',
    'dry_run'     => getenv('SA_FORM_DRYRUN') === '1',
    'rate_max'    => 5,     // aynı IP'den pencere içinde en fazla gönderim
    'rate_window' => 3600,  // saniye
    'min_seconds' => 2,     // form açıldıktan sonra en erken gönderim (bot tuzağı)
    'max_bytes'   => 65536, // iletişim formu için gövde sınırı
];

$FORMS = [
    'iletisim' => [
        'prefix'  => 'SA-ILT',
        'subject' => 'Web sitesi iletişim mesajı – %s',
        'konular' => ['Genel bilgi', 'Teklif', 'Randevu', 'Diğer'],
    ],
    // 'proje' => [...]  Projenizi Anlatın formu (dosya yükleme ile) — sayfa yapılınca eklenecek
];

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(int $status, array $data): void
{
    global $wantsJson;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    // JS kapalıyken: sade bir sonuç sayfası
    header('Content-Type: text/html; charset=utf-8');
    $ok = !empty($data['ok']);
    $title = $ok ? 'Mesajınız bize ulaştı' : 'Mesajınız gönderilemedi';
    $lines = [];
    if ($ok && !empty($data['talep_no'])) $lines[] = 'Talep numaranız: <strong>' . h($data['talep_no']) . '</strong>';
    if ($ok) $lines[] = 'En kısa sürede size dönüş yapacağız.';
    if (!$ok) $lines[] = h($data['message'] ?? 'Lütfen bilgileri kontrol edip tekrar deneyin.');
    foreach ($data['errors'] ?? [] as $msg) $lines[] = h($msg);
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . h($title) . ' | Sibel Aydın Mimarlık</title>'
        . '<link rel="stylesheet" href="/assets/css/style.css"></head><body class="page-inner"><main class="section"><div class="container prose">'
        . '<h1>' . h($title) . '</h1><p>' . implode('</p><p>', $lines) . '</p>'
        . '<p><a href="/iletisim/">İletişim sayfasına dönün</a> · <a href="tel:+905368475640">0536 847 56 40</a></p>'
        . '</div></main></body></html>';
    exit;
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Tek satırlık alan: kontrol karakterleri ve satır sonları atılır, boşluklar sadeleşir. */
function clean_line($v): string
{
    $v = is_string($v) ? $v : '';
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    return trim(preg_replace('/\s+/u', ' ', $v) ?? '');
}

/** Çok satırlı metin: satır sonları korunur, diğer kontrol karakterleri atılır. */
function clean_text($v): string
{
    $v = is_string($v) ? str_replace(["\r\n", "\r"], "\n", $v) : '';
    $v = preg_replace('/[\x00-\x08\x0B-\x1F\x7F]+/u', '', $v) ?? '';
    return trim(preg_replace("/\n{3,}/", "\n\n", $v) ?? '');
}

function mime_header(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

function data_dir(): string
{
    global $CONFIG;
    $dir = $CONFIG['data_dir'];
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
        @file_put_contents($dir . '/index.html', '');
    }
    return $dir;
}

/** IP başına hız sınırı (IP özetlenerek saklanır). true: izin var. */
function rate_ok(string $ip): bool
{
    global $CONFIG;
    $file = data_dir() . '/rate-' . substr(hash('sha256', 'sa-form|' . $ip), 0, 32) . '.json';
    $now = time();
    $fh = @fopen($file, 'c+');
    if (!$fh) return true; // depolama yoksa formu engelleme
    flock($fh, LOCK_EX);
    $list = json_decode(stream_get_contents($fh) ?: '[]', true);
    $list = array_values(array_filter(is_array($list) ? $list : [], fn($t) => is_int($t) && $t > $now - $CONFIG['rate_window']));
    $ok = count($list) < $CONFIG['rate_max'];
    if ($ok) $list[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($list));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

/** Yıl içinde sıralı talep numarası: SA-ILT-2026-0001 */
function next_ticket(string $prefix): string
{
    $year = date('Y');
    $file = data_dir() . '/sayac-' . strtolower($prefix) . '-' . $year . '.txt';
    $fh = @fopen($file, 'c+');
    if (!$fh) return sprintf('%s-%s-%s', $prefix, $year, strtoupper(substr(bin2hex(random_bytes(3)), 0, 4)));
    flock($fh, LOCK_EX);
    $n = (int) trim(stream_get_contents($fh) ?: '0') + 1;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, (string) $n);
    flock($fh, LOCK_UN);
    fclose($fh);
    return sprintf('%s-%s-%04d', $prefix, $year, $n);
}

function send_mail(string $to, string $subject, string $body, string $replyTo): bool
{
    global $CONFIG;
    $headers = [
        'From: ' . mime_header($CONFIG['from_name']) . ' <' . $CONFIG['from'] . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: sibelaydinmimarlik-form',
    ];
    if ($CONFIG['dry_run']) {
        $log = "=== " . date('c') . "\nTo: $to\nSubject: $subject\n" . implode("\n", $headers) . "\n\n$body\n\n";
        return (bool) file_put_contents(data_dir() . '/mail-dryrun.txt', $log, FILE_APPEND);
    }
    return mail($to, mime_header($subject), $body, implode("\r\n", $headers), '-f' . $CONFIG['from']);
}

// ---------------------------------------------------------------- İstek kontrolleri
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'message' => 'Yalnızca POST kabul edilir.']);
}

// Başka bir siteden gönderim engeli (Origin varsa bu sunucuyla aynı olmalı)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
    respond(403, ['ok' => false, 'message' => 'Geçersiz istek kaynağı.']);
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $CONFIG['max_bytes']) {
    respond(413, ['ok' => false, 'message' => 'Gönderilen veri çok büyük.']);
}

$type = clean_line($_POST['form_type'] ?? '');
if (!isset($FORMS[$type])) {
    respond(400, ['ok' => false, 'message' => 'Bilinmeyen form tipi.']);
}
$form = $FORMS[$type];

// Bot tuzakları: honeypot doluysa ya da form çok hızlı gönderildiyse sessizce "başarılı" dön
$honeypot = clean_line($_POST['website'] ?? '');
$ts = (int) ($_POST['ts'] ?? 0);
if ($honeypot !== '' || ($ts > 0 && time() - $ts < $CONFIG['min_seconds'])) {
    respond(200, ['ok' => true, 'talep_no' => null]);
}

// ---------------------------------------------------------------- İletişim formu
$ad      = clean_line($_POST['ad_soyad'] ?? '');
$telefon = clean_line($_POST['telefon'] ?? '');
$eposta  = clean_line($_POST['eposta'] ?? '');
$konu    = clean_line($_POST['konu'] ?? '');
$mesaj   = clean_text($_POST['mesaj'] ?? '');
$kvkk    = isset($_POST['kvkk']);

$errors = [];
$adLen = mb_strlen($ad, 'UTF-8');
if ($adLen < 2 || $adLen > 100) $errors['ad_soyad'] = 'Lütfen adınızı ve soyadınızı yazın.';
$digits = preg_replace('/\D/', '', $telefon) ?? '';
if (strlen($digits) < 10 || strlen($digits) > 13 || mb_strlen($telefon, 'UTF-8') > 20) $errors['telefon'] = 'Lütfen geçerli bir telefon numarası yazın.';
if (mb_strlen($eposta, 'UTF-8') > 150 || !filter_var($eposta, FILTER_VALIDATE_EMAIL)) $errors['eposta'] = 'Lütfen geçerli bir e-posta adresi yazın.';
if ($konu === '') $konu = $form['konular'][0];
if (!in_array($konu, $form['konular'], true)) $errors['konu'] = 'Lütfen listeden bir konu seçin.';
$mesajLen = mb_strlen($mesaj, 'UTF-8');
if ($mesajLen < 10 || $mesajLen > 2000) $errors['mesaj'] = 'Mesajınız 10 ile 2000 karakter arasında olmalı.';
if (!$kvkk) $errors['kvkk'] = 'Devam etmek için KVKK Aydınlatma Metni\'ni okuduğunuzu onaylayın.';

if ($errors) {
    respond(422, ['ok' => false, 'message' => 'Lütfen işaretli alanları kontrol edin.', 'errors' => $errors]);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (!rate_ok($ip)) {
    respond(429, ['ok' => false, 'message' => 'Kısa sürede çok sayıda mesaj gönderildi. Lütfen daha sonra tekrar deneyin ya da bizi arayın.']);
}

$talepNo = next_ticket($form['prefix']);
$tarih = date('d.m.Y H:i');

// Firmaya giden e-posta (yanıtla → müşteri)
$firmaBody = "Talep No: $talepNo\nTarih: $tarih\nKonu: $konu\n\n"
    . "Ad Soyad: $ad\nTelefon: $telefon\nE-posta: $eposta\n\n"
    . "Mesaj:\n$mesaj\n\n"
    . "---\nKVKK Aydınlatma Metni: okundu olarak işaretlendi\n"
    . "IP: $ip\nForm: İletişim sayfası (/iletisim/)\n";
$sent = send_mail($CONFIG['to'], sprintf($form['subject'], $konu), $firmaBody, $eposta);
if (!$sent) {
    respond(500, ['ok' => false, 'message' => 'Mesajınız şu anda gönderilemedi. Lütfen tekrar deneyin ya da 0536 847 56 40 numarasından bize ulaşın.']);
}

// Müşteriye kısa otomatik yanıt (başarısız olsa da talep alınmıştır)
$musteriBody = "Merhaba $ad,\n\n"
    . "Sibel Aydın Mimarlık web sitesi üzerinden gönderdiğiniz mesaj bize ulaştı. Talep numaranız: $talepNo\n\n"
    . "En kısa sürede size dönüş yapacağız. Acil durumlar için 0536 847 56 40 numarasından bize ulaşabilirsiniz.\n\n"
    . "Sibel Aydın Mimarlık\n"
    . "Piri Mehmet Paşa Mah. Şerif Sk. Osmanoğlu İş Merkezi No:1 İç Kapı No:10, 34570 Silivri / İstanbul\n"
    . "https://www.sibelaydinmimarlik.com.tr\n\n"
    . "Kişisel verileriniz KVKK Aydınlatma Metni kapsamında işlenmektedir: https://www.sibelaydinmimarlik.com.tr/kvkk/\n";
send_mail($eposta, "Mesajınızı aldık – Talep No: $talepNo", $musteriBody, $CONFIG['to']);

respond(200, ['ok' => true, 'talep_no' => $talepNo]);
