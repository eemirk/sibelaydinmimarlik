<?php
/**
 * Form e-posta ayarları — ŞABLON (repoda boş değerlerle durur)
 *
 * Sunucuda bu dosyayı "config.local.php" adıyla kopyalayın ve değerleri doldurun.
 * config.local.php .gitignore'dadır, make-dist paketine girmez ve web'den çağrılamaz (api/.htaccess).
 *
 * SMTP_PASS: Google Workspace → proje@ hesabı → Güvenlik → 2 Adımlı Doğrulama açık →
 *            "Uygulama şifreleri" ile üretilen 16 haneli şifre (hesabın normal şifresi DEĞİL).
 * NOTIFY_TO: talep bildirimlerinin gideceği adres(ler); birden fazlası virgülle ayrılır.
 * MAIL_DRIVER: smtp (canlı) | file (test: e-posta gönderilmez, private_data/mail-out/ altına .eml yazılır)
 * DATA_DIR: boş bırakılırsa public_html'in bir üstündeki private_data/ kullanılır.
 */
return [
    'MAIL_DRIVER'    => 'smtp',
    'SMTP_HOST'      => 'smtp.gmail.com',
    'SMTP_PORT'      => 465,
    'SMTP_SECURE'    => 'ssl',
    'SMTP_USER'      => '',
    'SMTP_PASS'      => '',
    'MAIL_FROM'      => 'proje@sibelaydinmimarlik.com.tr',
    'MAIL_FROM_NAME' => 'Sibel Aydın Mimarlık',
    'NOTIFY_TO'      => 'proje@sibelaydinmimarlik.com.tr',
    'DATA_DIR'       => '',
];
