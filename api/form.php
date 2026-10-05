<?php
/**
 * Sibel Aydın İnşaat Mimarlık — form uç noktası
 *
 *   POST /api/form.php   form_type=iletisim   İletişim sayfası kısa formu        talep no SA-ILT-YIL-####
 *                        form_type=proje      Projenizi Anlatın (dosya yüklemeli) talep no SA-YIL-####
 *
 * Yanıt: fetch/XHR ile (Accept: application/json) JSON; JS kapalıysa HTML sayfa (proje: teşekkür sayfasına 303).
 *   200 {ok:true, talep_no[, redirect]}   422 {ok:false, errors:{alan: mesaj}}   413 çok büyük   429 çok sık   403 başka site
 *
 * E-posta: PHPMailer + Google Workspace SMTP (ayarlar api/config.local.php — repoda yalnızca config.example.php).
 *   MAIL_DRIVER=file → gönderilmez, private_data/mail-out/*.eml yazılır (yerel test).
 *   SMTP ayarı yoksa ya da gönderim başarısızsa talep yine kaydedilir ve kullanıcıya başarı döner; hata log'a yazılır.
 *
 * Veri: public_html DIŞINDA  <DOCUMENT_ROOT'un üstü>/private_data/
 *   talepler/<NO>.json   uploads/<NO>/   sayac/   rate/   mail-out/   logs/form.log
 *   Yazılamıyorsa api/_data/ (web'den kapalı) yedek olarak kullanılır ve log'a uyarı düşülür.
 * Test: SA_MAIL_DRIVER=file, SA_DATA_DIR=<klasör> ortam değişkenleri ayarları ezer.
 */
declare(strict_types=1);

date_default_timezone_set('Europe/Istanbul');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

// ---------------------------------------------------------------- Ayarlar
$CONFIG = [
    'MAIL_DRIVER'    => 'smtp',
    'SMTP_HOST'      => 'smtp.gmail.com',
    'SMTP_PORT'      => 465,
    'SMTP_SECURE'    => 'ssl',
    'SMTP_USER'      => '',
    'SMTP_PASS'      => '',
    'MAIL_FROM'      => 'proje@sibelaydinmimarlik.com.tr',
    'MAIL_FROM_NAME' => 'Sibel Aydın İnşaat Mimarlık',
    'NOTIFY_TO'      => 'proje@sibelaydinmimarlik.com.tr',
    'DATA_DIR'       => '',
];
$CONFIG_FILE = __DIR__ . '/config.local.php';
if (is_file($CONFIG_FILE)) {
    $local = require $CONFIG_FILE;
    if (is_array($local)) $CONFIG = array_merge($CONFIG, $local);
}
if (getenv('SA_MAIL_DRIVER')) $CONFIG['MAIL_DRIVER'] = getenv('SA_MAIL_DRIVER');
if (getenv('SA_DATA_DIR')) $CONFIG['DATA_DIR'] = getenv('SA_DATA_DIR');

const SITE_URL = 'https://www.sibelaydinmimarlik.com.tr';
const TEL_DISPLAY = '0212 727 10 20';   // Telefon (sabit hat)
const GSM_DISPLAY = '0536 847 56 40';   // GSM
const WA_URL = 'https://wa.me/905368475640';

const RATE_MAX = 5;           // aynı IP'den pencere içinde en fazla gönderim (iki form tipi ortak)
const RATE_WINDOW = 3600;     // saniye
const MIN_SECONDS = 2;        // form açıldıktan sonra en erken gönderim (bot tuzağı)

const UPLOAD_MAX_FILES = 10;
const UPLOAD_MAX_FILE = 15 * 1024 * 1024;
const UPLOAD_MAX_TOTAL = 25 * 1024 * 1024;
const ATTACH_MAX_TOTAL = 20 * 1024 * 1024;  // bunun üstünde dosyalar e-postaya eklenmez, sunucuda kalır

// Uzantı → kabul edilen MIME türleri (finfo). octet-stream/text yalnızca imza kontrolü geçerse kabul edilir.
const UPLOAD_TYPES = [
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
    'webp' => ['image/webp'],
    'heic' => ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', 'application/octet-stream'],
    'pdf'  => ['application/pdf'],
    'dwg'  => ['image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/x-acad', 'application/autocad_dwg', 'application/dwg', 'application/x-dwg', 'application/octet-stream'],
    'dxf'  => ['image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf', 'text/plain', 'text/x-dxf', 'application/octet-stream'],
];
// Dosya adının HERHANGİ bir parçasında geçerse reddedilir (ör. plan.php.jpg)
const EXEC_EXT = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'pht', 'phps', 'cgi', 'pl', 'py', 'rb', 'sh', 'bash',
    'asp', 'aspx', 'jsp', 'exe', 'com', 'bat', 'cmd', 'msi', 'dll', 'scr', 'vbs', 'js', 'mjs', 'jar', 'htm', 'html', 'shtml', 'svg', 'htaccess', 'ini'];

const PROJE_TURLERI = ['villa' => 'Villa / Müstakil', 'konut' => 'Konut / Apartman', 'ticari' => 'Ticari Yapı', 'tadilat' => 'Tadilat', 'ic-mekan' => 'İç Mekân', 'diger' => 'Diğer'];
const HIZMETLER = ['mimari-proje' => 'Mimari Proje', 'ruhsat' => 'Ruhsat', 'iskan' => 'İskân', 'ic-mimari' => 'İç Mimari', '3d-gorsellestirme' => '3D Görselleştirme',
    'uygulama' => 'İnşaat ve Uygulama', 'prefabrik-yapilar' => 'Prefabrik Yapılar', 'santiye-teknik' => 'Şantiye / Teknik', 'mimari-danismanlik' => 'Mimari Danışmanlık', 'kentsel-donusum' => 'Kentsel Dönüşüm',
    'ekb' => 'EKB', 'bina-akustigi' => 'Bina Akustiği', 'bilirkisilik' => 'Bilirkişilik'];
const ASAMALAR = ['arsa' => 'Arsam var, proje aşamasındayım', 'ruhsat' => 'Ruhsat aşamasındayım', 'insaat' => 'İnşaat sürüyor',
    'mevcut' => 'Mevcut yapı (tadilat, iskân vb.)', 'fikir' => 'Henüz fikir aşamasında'];
const ILLER = [
    'İstanbul' => ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz',
        'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy',
        'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
        'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'Tekirdağ' => ['Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Süleymanpaşa', 'Şarköy'],
    'Diğer'    => [],
];
const ULASIM = ['telefon' => 'Telefon', 'whatsapp' => 'WhatsApp', 'eposta' => 'E-posta'];

$FORMS = [
    'iletisim' => ['prefix' => 'SA-ILT', 'max_bytes' => 65536, 'konular' => ['Genel bilgi', 'Teklif', 'Randevu', 'Diğer']],
    'proje'    => ['prefix' => 'SA', 'max_bytes' => UPLOAD_MAX_TOTAL + 2 * 1024 * 1024],
];

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

// ---------------------------------------------------------------- Yardımcılar
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

function len(string $s): int
{
    return mb_strlen($s, 'UTF-8');
}

/** Sunucu log'u (error_log) + veri klasöründeki form.log */
function log_msg(string $msg): void
{
    error_log('[sa-form] ' . $msg);
    @file_put_contents(data_sub('logs') . '/form.log', date('c') . ' ' . $msg . "\n", FILE_APPEND | LOCK_EX);
}

/** Veri kökü: public_html dışındaki private_data/; yazılamıyorsa api/_data/ (web'den kapalı). */
function data_root(): string
{
    static $root = null;
    if ($root !== null) return $root;
    global $CONFIG;
    $candidates = [];
    if ($CONFIG['DATA_DIR'] !== '') $candidates[] = $CONFIG['DATA_DIR'];
    $doc = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\');
    if ($doc !== '') $candidates[] = dirname($doc) . '/private_data';
    foreach ($candidates as $dir) {
        if ((is_dir($dir) || @mkdir($dir, 0750, true)) && is_writable($dir)) return $root = rtrim($dir, '/\\');
    }
    $root = __DIR__ . '/_data';
    if (!is_dir($root)) @mkdir($root, 0750, true);
    if (!is_file($root . '/.htaccess')) @file_put_contents($root . '/.htaccess', "Require all denied\n");
    if (!is_file($root . '/index.html')) @file_put_contents($root . '/index.html', '');
    log_msg('UYARI: private_data yazılamıyor (' . implode(', ', $candidates) . '); yedek klasör api/_data kullanılıyor.');
    return $root;
}

function data_sub(string $name): string
{
    $dir = data_root() . '/' . $name;
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir;
}

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
    // JS kapalıyken: proje başarısı teşekkür sayfasına, diğerleri sade sonuç sayfasına
    if (!empty($data['ok']) && !empty($data['redirect'])) {
        header('Location: ' . $data['redirect'], true, 303);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $ok = !empty($data['ok']);
    $title = $ok ? 'Mesajınız bize ulaştı' : 'Talebiniz gönderilemedi';
    $lines = [];
    if ($ok && !empty($data['talep_no'])) $lines[] = 'Talep numaranız: <strong>' . h($data['talep_no']) . '</strong>';
    if ($ok) $lines[] = 'En kısa sürede size dönüş yapacağız.';
    if (!$ok) $lines[] = h($data['message'] ?? 'Lütfen bilgileri kontrol edip tekrar deneyin.');
    foreach ($data['errors'] ?? [] as $msg) $lines[] = h($msg);
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . h($title) . ' | Sibel Aydın İnşaat Mimarlık</title>'
        . '<link rel="stylesheet" href="/assets/css/style.css"></head><body class="page-inner"><main class="section"><div class="container prose">'
        . '<h1>' . h($title) . '</h1><p>' . implode('</p><p>', $lines) . '</p>'
        . '<p><a href="javascript:history.back()">Forma geri dönün</a> · Telefon: <a href="tel:+902127271020">' . TEL_DISPLAY . '</a> · GSM: <a href="tel:+905368475640">' . GSM_DISPLAY . '</a> · <a href="' . WA_URL . '">WhatsApp</a></p>'
        . '</div></main></body></html>';
    exit;
}

/** IP başına hız sınırı (IP özetlenerek saklanır). true: izin var. */
function rate_ok(string $ip): bool
{
    $file = data_sub('rate') . '/' . substr(hash('sha256', 'sa-form|' . $ip), 0, 32) . '.json';
    $now = time();
    $fh = @fopen($file, 'c+');
    if (!$fh) return true; // depolama yoksa formu engelleme
    flock($fh, LOCK_EX);
    $list = json_decode(stream_get_contents($fh) ?: '[]', true);
    $list = array_values(array_filter(is_array($list) ? $list : [], fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
    $ok = count($list) < RATE_MAX;
    if ($ok) $list[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($list));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

/** Yıl içinde sıralı talep numarası: SA-ILT-2026-0001 / SA-2026-0001 (form tipi başına ayrı sayaç) */
function next_ticket(string $prefix): string
{
    $year = date('Y');
    $fh = @fopen(data_sub('sayac') . '/' . strtolower($prefix) . '-' . $year . '.txt', 'c+');
    if (!$fh) {
        log_msg('UYARI: sayaç dosyası açılamadı; rastgele talep no üretildi.');
        return sprintf('%s-%s-R%s', $prefix, $year, strtoupper(bin2hex(random_bytes(2))));
    }
    flock($fh, LOCK_EX);
    $n = (int) trim(stream_get_contents($fh) ?: '0') + 1;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, (string) $n);
    flock($fh, LOCK_UN);
    fclose($fh);
    return sprintf('%s-%s-%04d', $prefix, $year, $n);
}

function save_request(string $no, array $record): void
{
    $ok = @file_put_contents(data_sub('talepler') . '/' . $no . '.json', json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    if ($ok === false) log_msg("HATA: $no talep yedeği yazılamadı.");
}

/** Gönderen ve sürücü ayarlı PHPMailer */
function mailer(): PHPMailer
{
    global $CONFIG;
    $m = new PHPMailer(true);
    $m->CharSet = PHPMailer::CHARSET_UTF8;
    $m->setLanguage('tr', __DIR__ . '/lib/PHPMailer/');
    $m->setFrom($CONFIG['MAIL_FROM'], $CONFIG['MAIL_FROM_NAME']);
    $m->XMailer = 'sibelaydinmimarlik-form';
    if ($CONFIG['MAIL_DRIVER'] === 'smtp') {
        $m->isSMTP();
        $m->Host = $CONFIG['SMTP_HOST'];
        $m->Port = (int) $CONFIG['SMTP_PORT'];
        $m->SMTPSecure = $CONFIG['SMTP_SECURE'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        $m->SMTPAuth = true;
        $m->Username = $CONFIG['SMTP_USER'];
        $m->Password = $CONFIG['SMTP_PASS'];
        $m->Timeout = 20;
    }
    return $m;
}

/** Gönderir (ya da file modunda .eml yazar). Hata fırlatmaz; sonucu döner ve log'a yazar. */
function deliver(PHPMailer $m, string $tag): bool
{
    global $CONFIG, $CONFIG_FILE;
    try {
        if ($CONFIG['MAIL_DRIVER'] === 'file') {
            $m->preSend();
            return file_put_contents(data_sub('mail-out') . '/' . $tag . '.eml', $m->getSentMIMEMessage()) !== false;
        }
        if ($CONFIG['SMTP_USER'] === '' || $CONFIG['SMTP_PASS'] === '') {
            log_msg("HATA: $tag gönderilemedi — SMTP ayarı yok (" . (is_file($CONFIG_FILE) ? 'config.local.php eksik değer' : 'config.local.php bulunamadı') . ').');
            return false;
        }
        return $m->send();
    } catch (MailException $e) {
        log_msg("HATA: $tag gönderilemedi — " . $m->ErrorInfo);
        return false;
    }
}

function notify_addresses(): array
{
    global $CONFIG;
    $list = array_filter(array_map('trim', explode(',', (string) $CONFIG['NOTIFY_TO'])), fn($a) => (bool) filter_var($a, FILTER_VALIDATE_EMAIL));
    return $list ?: ['proje@sibelaydinmimarlik.com.tr'];
}

/** Ortak iletişim alanları (ad, telefon, e-posta, KVKK) */
function validate_contact(array &$errors): array
{
    $ad = clean_line($_POST['ad_soyad'] ?? '');
    $telefon = clean_line($_POST['telefon'] ?? '');
    $eposta = clean_line($_POST['eposta'] ?? '');
    if (len($ad) < 2 || len($ad) > 100) $errors['ad_soyad'] = 'Lütfen adınızı ve soyadınızı yazın.';
    $digits = preg_replace('/\D/', '', $telefon) ?? '';
    if (strlen($digits) < 10 || strlen($digits) > 13 || len($telefon) > 20) $errors['telefon'] = 'Lütfen geçerli bir telefon numarası yazın.';
    if (len($eposta) > 150 || !filter_var($eposta, FILTER_VALIDATE_EMAIL)) $errors['eposta'] = 'Lütfen geçerli bir e-posta adresi yazın.';
    if (!isset($_POST['kvkk'])) $errors['kvkk'] = 'Devam etmek için KVKK Aydınlatma Metni\'ni okuduğunuzu onaylayın.';
    return ['ad' => $ad, 'telefon' => $telefon, 'eposta' => $eposta];
}

/** m² alanı: boş olabilir; doluysa 1–1.000.000 arası sayı */
function parse_m2(string $field, array &$errors): ?string
{
    $v = str_replace(' ', '', clean_line($_POST[$field] ?? ''));
    if ($v === '') return null;
    if (!preg_match('/^\d{1,7}([.,]\d{1,2})?$/', $v) || (float) str_replace(',', '.', $v) <= 0 || (float) str_replace(',', '.', $v) > 1000000) {
        $errors[$field] = 'Lütfen metrekareyi yalnızca sayı olarak yazın (ör. 450).';
        return null;
    }
    return str_replace('.', ',', $v);
}

/** Dosya imzası (ilk baytlar) uzantıyla uyuşuyor mu? */
function signature_ok(string $ext, string $path): bool
{
    $head = (string) @file_get_contents($path, false, null, 0, 4096);
    switch ($ext) {
        case 'jpg':
        case 'jpeg': return strncmp($head, "\xFF\xD8\xFF", 3) === 0;
        case 'png':  return strncmp($head, "\x89PNG\r\n\x1A\n", 8) === 0;
        case 'webp': return strncmp($head, 'RIFF', 4) === 0 && substr($head, 8, 4) === 'WEBP';
        case 'pdf':  return strpos(substr($head, 0, 1024), '%PDF-') !== false;
        case 'heic': return substr($head, 4, 4) === 'ftyp' && in_array(substr($head, 8, 4), ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'], true);
        case 'dwg':  return strncmp($head, 'AC10', 4) === 0 || strncmp($head, 'AC1.', 4) === 0 || strncmp($head, 'AC2.', 4) === 0;
        case 'dxf':  return strncmp($head, 'AutoCAD Binary DXF', 18) === 0 || (bool) preg_match('/^\s*0\s*\r?\n\s*SECTION/', $head) || (bool) preg_match('/^\s*999\s*\r?\n/', $head);
    }
    return false;
}

/** Yüklenen dosyaları doğrular. Dönüş: [[tmp, ad, uzantı, boyut, mime], ...]; hata varsa $errors['dosyalar']. */
function collect_uploads(array &$errors): array
{
    $f = $_FILES['dosyalar'] ?? null;
    if (!$f || !isset($f['name'])) return [];
    $count = is_array($f['name']) ? count($f['name']) : 1;
    $norm = fn($k, $i) => is_array($f[$k]) ? $f[$k][$i] : $f[$k];
    $files = [];
    $msgs = [];
    $total = 0;
    $finfo = class_exists('finfo') ? new finfo(FILEINFO_MIME_TYPE) : null;
    if (!$finfo) log_msg('UYARI: fileinfo eklentisi yok; dosyalar yalnızca imzayla doğrulanıyor.');
    for ($i = 0; $i < $count; $i++) {
        $err = (int) $norm('error', $i);
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        $name = clean_line((string) $norm('name', $i));
        $name = len($name) > 120 ? mb_substr($name, 0, 120, 'UTF-8') : $name;
        $shown = $name !== '' ? $name : 'Dosya';
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) { $msgs[] = "$shown: dosya başına en fazla 15 MB yükleyebilirsiniz."; continue; }
        if ($err !== UPLOAD_ERR_OK) { $msgs[] = "$shown yüklenemedi, lütfen tekrar deneyin."; continue; }
        $tmp = (string) $norm('tmp_name', $i);
        $size = (int) $norm('size', $i);
        if (!is_uploaded_file($tmp)) { $msgs[] = "$shown yüklenemedi."; continue; }
        $parts = array_map('strtolower', explode('.', $name));
        $ext = count($parts) > 1 ? end($parts) : '';
        if (count(array_intersect(array_slice($parts, 1), EXEC_EXT)) > 0) { $msgs[] = "$shown: güvenlik nedeniyle bu dosya kabul edilmiyor."; continue; }
        if (!isset(UPLOAD_TYPES[$ext])) { $msgs[] = "$shown: bu dosya türü kabul edilmiyor (JPG, PNG, HEIC, WEBP, PDF, DWG, DXF)."; continue; }
        if ($size > UPLOAD_MAX_FILE) { $msgs[] = "$shown: dosya başına en fazla 15 MB yükleyebilirsiniz."; continue; }
        $mime = $finfo ? (string) $finfo->file($tmp) : 'bilinmiyor';
        if (($finfo && !in_array($mime, UPLOAD_TYPES[$ext], true)) || !signature_ok($ext, $tmp)) {
            $msgs[] = "$shown: dosya içeriği uzantısıyla uyuşmuyor ya da dosya bozuk.";
            continue;
        }
        $total += $size;
        $files[] = ['tmp' => $tmp, 'ad' => $name, 'uzanti' => $ext, 'boyut' => $size, 'mime' => $mime];
    }
    if (count($files) > UPLOAD_MAX_FILES) $msgs[] = 'En fazla 10 dosya yükleyebilirsiniz.';
    if ($total > UPLOAD_MAX_TOTAL) $msgs[] = 'Dosyaların toplam boyutu 25 MB\'ı aşamaz.';
    if ($msgs) $errors['dosyalar'] = implode(' ', $msgs);
    return $files;
}

function size_text(int $bytes): string
{
    return $bytes >= 1048576 ? number_format($bytes / 1048576, 1, ',', '.') . ' MB' : max(1, (int) round($bytes / 1024)) . ' KB';
}

/** HTML e-posta gövdesi: başlık + iki sütunlu tablo */
function html_table(string $title, array $rows, string $intro = '', string $outro = ''): string
{
    $tr = '';
    foreach ($rows as $k => $v) {
        $tr .= '<tr><th style="text-align:left;vertical-align:top;padding:8px 16px 8px 0;color:#6B6B6B;font-weight:500;white-space:nowrap;border-top:1px solid #E1E5E5">' . h($k)
            . '</th><td style="padding:8px 0;border-top:1px solid #E1E5E5;color:#1E1E1E">' . nl2br(h($v)) . '</td></tr>';
    }
    return '<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#F6F7F6;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1E1E1E">'
        . '<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E1E5E5;padding:28px">'
        . '<h1 style="font-size:20px;margin:0 0 16px">' . h($title) . '</h1>'
        . ($intro !== '' ? '<p style="margin:0 0 16px">' . $intro . '</p>' : '')
        . '<table style="border-collapse:collapse;width:100%">' . $tr . '</table>'
        . ($outro !== '' ? '<p style="margin:20px 0 0;color:#6B6B6B;font-size:13px">' . $outro . '</p>' : '')
        . '</div></body></html>';
}

function text_table(array $rows): string
{
    $out = '';
    foreach ($rows as $k => $v) $out .= str_contains($v, "\n") ? "$k:\n$v\n\n" : "$k: $v\n";
    return $out;
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

// post_max_size aşılınca PHP $_POST ve $_FILES'ı boşaltır
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && empty($_POST) && empty($_FILES)) {
    respond(413, ['ok' => false, 'message' => 'Gönderdiğiniz dosyalar çok büyük. Toplam en fazla 25 MB yükleyebilirsiniz.']);
}

$type = clean_line($_POST['form_type'] ?? '');
if (!isset($FORMS[$type])) {
    respond(400, ['ok' => false, 'message' => 'Bilinmeyen form tipi.']);
}
$form = $FORMS[$type];
if ($contentLength > $form['max_bytes']) {
    respond(413, ['ok' => false, 'message' => 'Gönderilen veri çok büyük.']);
}

// Bot tuzakları: honeypot doluysa ya da form çok hızlı gönderildiyse sessizce "başarılı" dön
$ts = (int) ($_POST['ts'] ?? 0);
if (clean_line($_POST['website'] ?? '') !== '' || ($ts > 0 && time() - $ts < MIN_SECONDS)) {
    respond(200, ['ok' => true, 'talep_no' => null] + ($type === 'proje' ? ['redirect' => '/projenizi-anlatin/tesekkurler/'] : []));
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$now = date('d.m.Y H:i');
$errors = [];

// ================================================================ İLETİŞİM
if ($type === 'iletisim') {
    $c = validate_contact($errors);
    $konu = clean_line($_POST['konu'] ?? '') ?: $form['konular'][0];
    $mesaj = clean_text($_POST['mesaj'] ?? '');
    if (!in_array($konu, $form['konular'], true)) $errors['konu'] = 'Lütfen listeden bir konu seçin.';
    if (len($mesaj) < 10 || len($mesaj) > 2000) $errors['mesaj'] = 'Mesajınız 10 ile 2000 karakter arasında olmalı.';
    if ($errors) respond(422, ['ok' => false, 'message' => 'Lütfen işaretli alanları kontrol edin.', 'errors' => $errors]);
    if (!rate_ok($ip)) respond(429, ['ok' => false, 'message' => 'Kısa sürede çok sayıda mesaj gönderildi. Lütfen daha sonra tekrar deneyin ya da bizi arayın.']);

    $no = next_ticket($form['prefix']);
    $record = ['talep_no' => $no, 'tip' => 'iletisim', 'tarih' => date('c'), 'ip' => $ip, 'konu' => $konu,
        'ad_soyad' => $c['ad'], 'telefon' => $c['telefon'], 'eposta' => $c['eposta'], 'mesaj' => $mesaj, 'kvkk_okundu' => true];
    save_request($no, $record);

    $rows = ['Talep No' => $no, 'Tarih' => $now, 'Konu' => $konu, 'Ad Soyad' => $c['ad'], 'Telefon' => $c['telefon'], 'E-posta' => $c['eposta'], 'Mesaj' => $mesaj];
    $m = mailer();
    foreach (notify_addresses() as $a) $m->addAddress($a);
    $m->addReplyTo($c['eposta'], $c['ad']);
    $m->Subject = "Web sitesi iletişim mesajı – $konu";
    $m->isHTML(true);
    $m->Body = html_table("İletişim mesajı $no", $rows, '', 'KVKK Aydınlatma Metni: okundu olarak işaretlendi · IP: ' . h($ip) . ' · Form: /iletisim/');
    $m->AltBody = text_table($rows) . "\n---\nKVKK Aydınlatma Metni: okundu olarak işaretlendi\nIP: $ip\nForm: /iletisim/\n";
    $record['firma_eposta'] = deliver($m, "$no-firma");

    $m = mailer();
    $m->addAddress($c['eposta'], $c['ad']);
    $m->addReplyTo(notify_addresses()[0], 'Sibel Aydın İnşaat Mimarlık');
    $m->Subject = "Mesajınızı aldık – Talep No: $no";
    $m->isHTML(false);
    $m->Body = "Merhaba {$c['ad']},\n\n"
        . "Sibel Aydın İnşaat Mimarlık web sitesi üzerinden gönderdiğiniz mesaj bize ulaştı. Talep numaranız: $no\n\n"
        . "En kısa sürede size dönüş yapacağız. Acil durumlar için bize telefonla ulaşabilirsiniz:\nTelefon: " . TEL_DISPLAY . "\nGSM: " . GSM_DISPLAY . "\n\n"
        . "Sibel Aydın İnşaat Mimarlık\nPiri Mehmet Paşa Mah. Şerif Sk. Osmanoğlu İş Merkezi No:1 İç Kapı No:10, 34570 Silivri / İstanbul\n" . SITE_URL . "\n\n"
        . 'Kişisel verileriniz KVKK Aydınlatma Metni kapsamında işlenmektedir: ' . SITE_URL . "/kvkk/\n";
    $record['musteri_eposta'] = deliver($m, "$no-musteri");
    save_request($no, $record);

    respond(200, ['ok' => true, 'talep_no' => $no]);
}

// ================================================================ PROJE (Projenizi Anlatın)
$turu = clean_line($_POST['proje_turu'] ?? '');
if (!isset(PROJE_TURLERI[$turu])) $errors['proje_turu'] = 'Lütfen proje türünü seçin.';
$hizmetIn = $_POST['hizmetler'] ?? [];
$hizmetler = array_values(array_unique(array_filter(array_map('clean_line', is_array($hizmetIn) ? $hizmetIn : [$hizmetIn]), fn($k) => isset(HIZMETLER[$k]))));
if (!$hizmetler) $errors['hizmetler'] = 'Lütfen en az bir hizmet seçin.';
$asama = clean_line($_POST['asama'] ?? '');
if (!isset(ASAMALAR[$asama])) $errors['asama'] = 'Lütfen projenizin aşamasını seçin.';
$il = clean_line($_POST['il'] ?? '');
$ilce = clean_line($_POST['ilce'] ?? '');
if (!isset(ILLER[$il])) {
    $errors['il'] = 'Lütfen il seçin.';
} elseif ($il === 'Diğer') {
    $ilce = clean_line($_POST['ilce_diger'] ?? '');
    if (len($ilce) < 2 || len($ilce) > 80) $errors['ilce_diger'] = 'Lütfen il ve ilçeyi yazın.';
} elseif (!in_array($ilce, ILLER[$il], true)) {
    $errors['ilce'] = 'Lütfen ilçe seçin.';
}
$arsa = parse_m2('arsa_m2', $errors);
$yapi = parse_m2('yapi_m2', $errors);
$aciklama = clean_text($_POST['aciklama'] ?? '');
if (len($aciklama) < 20 || len($aciklama) > 3000) $errors['aciklama'] = 'Proje açıklaması 20 ile 3000 karakter arasında olmalı.';
$c = validate_contact($errors);
$ulasim = clean_line($_POST['ulasim'] ?? 'telefon');
if (!isset(ULASIM[$ulasim])) $ulasim = 'telefon';
$uploads = collect_uploads($errors);

if ($errors) respond(422, ['ok' => false, 'message' => 'Lütfen işaretli alanları kontrol edin.', 'errors' => $errors]);
if (!rate_ok($ip)) respond(429, ['ok' => false, 'message' => 'Kısa sürede çok sayıda talep gönderildi. Lütfen daha sonra tekrar deneyin ya da bizi arayın.']);

$no = next_ticket($form['prefix']);

// Dosyalar: rastgele adla uploads/<NO>/ altına
$stored = [];
$totalSize = 0;
if ($uploads) {
    $dir = data_sub('uploads') . '/' . $no;
    @mkdir($dir, 0750, true);
    foreach ($uploads as $u) {
        $file = bin2hex(random_bytes(12)) . '.' . $u['uzanti'];
        if (@move_uploaded_file($u['tmp'], $dir . '/' . $file)) {
            @chmod($dir . '/' . $file, 0640);
            $stored[] = ['ad' => $u['ad'], 'dosya' => $file, 'boyut' => $u['boyut'], 'mime' => $u['mime'], 'yol' => $dir . '/' . $file];
            $totalSize += $u['boyut'];
        } else {
            log_msg("HATA: $no dosyası taşınamadı: {$u['ad']}");
        }
    }
}

$ilceText = $il === 'Diğer' ? $ilce : "$ilce / $il";
$hizmetText = implode(', ', array_map(fn($k) => HIZMETLER[$k], $hizmetler));
$record = ['talep_no' => $no, 'tip' => 'proje', 'tarih' => date('c'), 'ip' => $ip,
    'proje_turu' => PROJE_TURLERI[$turu], 'hizmetler' => array_map(fn($k) => HIZMETLER[$k], $hizmetler), 'asama' => ASAMALAR[$asama],
    'il' => $il, 'ilce' => $ilce, 'arsa_m2' => $arsa, 'yapi_m2' => $yapi, 'aciklama' => $aciklama,
    'ad_soyad' => $c['ad'], 'telefon' => $c['telefon'], 'eposta' => $c['eposta'], 'ulasim' => ULASIM[$ulasim], 'kvkk_okundu' => true,
    'dosyalar' => array_map(fn($s) => ['ad' => $s['ad'], 'dosya' => $s['dosya'], 'boyut' => $s['boyut'], 'mime' => $s['mime']], $stored)];
save_request($no, $record);

// Firma e-postası: HTML tablo + düz metin, dosyalar ekte (toplam 20 MB'a kadar)
$attach = $stored && $totalSize <= ATTACH_MAX_TOTAL;
$fileList = $stored ? implode("\n", array_map(fn($s) => $s['ad'] . ' (' . size_text($s['boyut']) . ')', $stored)) : 'Yok';
$fileNote = !$stored ? '' : ($attach ? 'Dosyalar bu e-postanın ekindedir.' : 'Dosyalar toplam ' . size_text($totalSize) . ' olduğu için e-postaya eklenmedi; sunucuda: private_data/uploads/' . $no . '/');
$rows = ['Talep No' => $no, 'Tarih' => $now, 'Proje türü' => PROJE_TURLERI[$turu], 'Talep edilen hizmetler' => $hizmetText, 'Aşama' => ASAMALAR[$asama],
    'Konum' => $ilceText, 'Arsa' => $arsa ? "$arsa m²" : '—', 'Yapı' => $yapi ? "$yapi m²" : '—', 'Açıklama' => $aciklama,
    'Ad Soyad' => $c['ad'], 'Telefon' => $c['telefon'], 'E-posta' => $c['eposta'], 'Tercih edilen iletişim' => ULASIM[$ulasim], 'Dosyalar' => $fileList];
$m = mailer();
foreach (notify_addresses() as $a) $m->addAddress($a);
$m->addReplyTo($c['eposta'], $c['ad']);
$m->Subject = "Yeni proje talebi $no – " . PROJE_TURLERI[$turu] . " – $ilce";
$m->isHTML(true);
$m->Body = html_table("Yeni proje talebi $no", $rows, $fileNote !== '' ? h($fileNote) : '', 'KVKK Aydınlatma Metni: okundu olarak işaretlendi · IP: ' . h($ip) . ' · Form: /projenizi-anlatin/');
$m->AltBody = "Yeni proje talebi $no\n\n" . text_table($rows) . ($fileNote !== '' ? "\n$fileNote\n" : '') . "\n---\nKVKK Aydınlatma Metni: okundu olarak işaretlendi\nIP: $ip\nForm: /projenizi-anlatin/\n";
if ($attach) foreach ($stored as $s) $m->addAttachment($s['yol'], $s['ad']);
$record['firma_eposta'] = deliver($m, "$no-firma");
$record['dosyalar_ekte'] = $attach;

// Müşteri e-postası: özet + 1 iş günü + telefon / WhatsApp
$waText = rawurlencode("Merhaba, web sitenizden $no numaralı proje talebini gönderdim.");
$summary = ['Talep No' => $no, 'Proje türü' => PROJE_TURLERI[$turu], 'Hizmetler' => $hizmetText, 'Konum' => $ilceText, 'Yüklenen dosya' => count($stored) . ' dosya'];
$m = mailer();
$m->addAddress($c['eposta'], $c['ad']);
$m->addReplyTo(notify_addresses()[0], 'Sibel Aydın İnşaat Mimarlık');
$m->Subject = "Talebiniz alındı – $no | Sibel Aydın İnşaat Mimarlık";
$m->isHTML(true);
$m->Body = html_table('Talebiniz alındı', $summary,
    'Merhaba ' . h($c['ad']) . ', proje talebiniz bize ulaştı. <strong>1 iş günü içinde</strong> size dönüş yapacağız.',
    'Bize telefonla ya da <a href="' . WA_URL . '?text=' . $waText . '" style="color:#12636D">WhatsApp</a> üzerinden de ulaşabilirsiniz.<br>'
    . 'Telefon: <a href="tel:+902127271020" style="color:#12636D">' . TEL_DISPLAY . '</a> · GSM: <a href="tel:+905368475640" style="color:#12636D">' . GSM_DISPLAY . '</a><br>'
    . 'Sibel Aydın İnşaat Mimarlık · Piri Mehmet Paşa Mah. Şerif Sk. Osmanoğlu İş Merkezi No:1 İç Kapı No:10, 34570 Silivri / İstanbul<br>'
    . 'Kişisel verileriniz <a href="' . SITE_URL . '/kvkk/" style="color:#12636D">KVKK Aydınlatma Metni</a> kapsamında işlenmektedir.');
$m->AltBody = "Merhaba {$c['ad']},\n\nProje talebiniz bize ulaştı. 1 iş günü içinde size dönüş yapacağız.\n\n" . text_table($summary)
    . "\nTelefon: " . TEL_DISPLAY . "\nGSM: " . GSM_DISPLAY . "\nWhatsApp: " . WA_URL . "?text=$waText\n\nSibel Aydın İnşaat Mimarlık\nPiri Mehmet Paşa Mah. Şerif Sk. Osmanoğlu İş Merkezi No:1 İç Kapı No:10, 34570 Silivri / İstanbul\n"
    . 'Kişisel verileriniz KVKK Aydınlatma Metni kapsamında işlenmektedir: ' . SITE_URL . "/kvkk/\n";
$record['musteri_eposta'] = deliver($m, "$no-musteri");
save_request($no, $record);

respond(200, ['ok' => true, 'talep_no' => $no, 'redirect' => '/projenizi-anlatin/tesekkurler/?no=' . rawurlencode($no)]);
