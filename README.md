# MasterChef Planner

Kişisel yapay zeka şefiniz — menü planlama, kür önerileri, smoothie, sağlık akademisi ve daha fazlası.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda açın (örn. http://localhost:5173). API anahtarını **⚙️ Ayarlar** üzerinden girebilirsiniz.

## Vercel ile yayınlama

1. Repoyu GitHub'a push edin.
2. [Vercel](https://vercel.com) → Import Project → bu repoyu seçin.
3. **Environment Variables** ekleyin (isteğe bağlı): `ANTHROPIC_API_KEY` = Anthropic API anahtarınız.
4. Deploy.

API anahtarını Vercel'de tanımlamazsanız, yayındaki sitede Ayarlar'dan da girebilirsiniz.

## Gereksinimler

- Node 18+
- [Anthropic API anahtarı](https://console.anthropic.com/) (Menü/Şef/Kür AI özellikleri için)
