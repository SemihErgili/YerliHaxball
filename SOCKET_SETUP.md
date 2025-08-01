# Socket Kurulumu ve Kullanımı

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Socket server ve Next.js uygulamasını aynı anda çalıştırın:
```bash
npm run dev:full
```

Alternatif olarak ayrı terminallerde çalıştırabilirsiniz:

Terminal 1 - Socket Server:
```bash
npm run socket
```

Terminal 2 - Next.js App:
```bash
npm run dev
```

## Nasıl Çalışır

- Socket server 3001 portunda çalışır
- Next.js uygulaması 9002 portunda çalışır
- Oyuncular aynı oda kodunu kullanarak aynı oyuna katılabilir
- Tüm oyuncu hareketleri, top pozisyonu ve skorlar gerçek zamanlı olarak senkronize edilir

## Özellikler

- ✅ Gerçek zamanlı multiplayer
- ✅ Oda sistemi (6 haneli kodlar)
- ✅ Oyuncu pozisyon senkronizasyonu
- ✅ Top fizik senkronizasyonu
- ✅ Skor senkronizasyonu
- ✅ Oyun durumu senkronizasyonu
- ✅ Otomatik oyuncu bağlantı/ayrılma yönetimi

## Kontroller

- **Hareket**: WASD veya Ok tuşları
- **Şut**: F tuşu (basılı tutup bırak)

## Test Etmek İçin

1. Uygulamayı çalıştırın
2. İki farklı tarayıcı sekmesi açın
3. Her ikisinde de aynı oda kodunu kullanarak oyuna katılın
4. Her iki sekmede de oyuncuların senkronize hareket ettiğini göreceksiniz