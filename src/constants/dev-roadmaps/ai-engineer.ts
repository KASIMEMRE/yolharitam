import { alt, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const AI_ENGINEER: DevRoadmap = {
  id: 'ai-engineer',
  kind: 'role',
  title: 'Yapay Zekâ Mühendisi',
  tagline: 'Büyük dil modelleriyle (LLM) gerçek ürünler ve ajanlar geliştir.',
  emoji: '🤖',
  hue: 'berry',
  sections: [
    {
      id: 'foundations',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('python', 'Python', 'Veri yapıları, fonksiyonlar, sanal ortamlar, paket yönetimi.', 1, 10, [doc('Python Resmi Eğitimi (docs.python.org)')]),
        t('apis-json', 'API’ler ve JSON', 'HTTP istekleri, JSON işleme, API anahtarlarını güvenle saklama.', 1, 3, [doc('Requests Docs'), doc('HTTPX Docs')]),
        t('git', 'Git ve GitHub', 'Kodunu ve deneylerini sürümle.', 1, 3, [doc('Pro Git (kitap, ücretsiz)')]),
        opt('math', 'Matematik sezgisi', 'Vektörler, olasılık ve gradyan inişini sezgisel düzeyde anla.', 2, 8, [vid('3Blue1Brown: Neural Networks')]),
      ],
    },
    {
      id: 'llm-basics',
      title: 'LLM’leri anlamak',
      emoji: '🧠',
      topics: [
        t('how-llm', 'LLM nasıl çalışır?', 'Token, bağlam penceresi, sıcaklık, olasılıksal üretim; transformer’a giriş.', 1, 4, [vid('Andrej Karpathy: Intro to Large Language Models')]),
        t('providers', 'Model sağlayıcıları', 'Kapalı (Claude, GPT, Gemini) ve açık modeller (Llama, Qwen); maliyet ve hız farkları.', 1, 2, [doc('Anthropic Docs'), doc('OpenAI Docs')]),
        t('limits', 'Sınırlar ve riskler', 'Halüsinasyon, önyargı, güncellik ve gizlilik sorunları.', 1, 2, []),
        opt('open-models', 'Açık modelleri yerelde çalıştır', 'Ollama ile bilgisayarında model çalıştırma.', 2, 2, [doc('Ollama Docs')]),
      ],
    },
    {
      id: 'prompting',
      title: 'Prompt mühendisliği',
      emoji: '✍️',
      topics: [
        t('prompt-basics', 'Etkili prompt yazımı', 'Net talimat, rol, örnekler (few-shot), adım adım düşündürme.', 1, 3, [doc('Anthropic: Prompt engineering overview'), course('DeepLearning.AI: ChatGPT Prompt Engineering for Developers')]),
        t('structured-output', 'Yapılandırılmış çıktı', 'JSON şemasıyla güvenilir çıktı alma ve doğrulama.', 2, 3, [doc('Pydantic Docs')]),
        t('evals', 'Değerlendirme (eval)', 'Prompt değişikliklerinin etkisini test setiyle ölç.', 2, 4, [doc('Anthropic: Create strong empirical evaluations')]),
      ],
    },
    {
      id: 'building',
      title: 'LLM ile uygulama geliştirme',
      emoji: '🛠️',
      topics: [
        t('sdk', 'Sağlayıcı SDK’ları', 'Mesaj API’si, akış (streaming), hata ve yeniden deneme yönetimi.', 1, 4, [doc('Anthropic SDK Docs'), doc('OpenAI SDK Docs')]),
        t('tool-use', 'Araç kullanımı (function calling)', 'Modelin senin fonksiyonlarını çağırmasını sağla.', 2, 4, [doc('Anthropic: Tool use')]),
        t('ui', 'Sohbet arayüzü', 'Akan cevaplar, yükleniyor durumu ve geçmiş yönetimi.', 2, 4, [doc('Vercel AI SDK Docs')]),
        opt('frameworks', 'Çatılar: LangChain / LlamaIndex', 'Hazır bileşenler; ne zaman işe yarar, ne zaman fazla gelir?', 2, 4, [doc('LangChain Docs'), doc('LlamaIndex Docs')]),
      ],
    },
    {
      id: 'rag',
      title: 'RAG: kendi verinle cevap',
      emoji: '📚',
      topics: [
        t('embeddings', 'Embedding ve benzerlik', 'Metni vektöre çevir, kosinüs benzerliğiyle ara.', 2, 4, [course('DeepLearning.AI: Vector Databases')]),
        t('vector-db', 'Vektör veritabanları', 'pgvector, Qdrant, Chroma; indeks türleri.', 2, 4, [doc('pgvector (GitHub)'), doc('Qdrant Docs')]),
        t('chunking', 'Belge parçalama ve hazırlama', 'Parça boyutu, örtüşme, meta veri; PDF ve web sayfası işleme.', 2, 3, []),
        t('rag-pipeline', 'RAG hattı', 'Getir → yeniden sırala → cevapla; kaynak gösterimi.', 3, 6, [doc('Anthropic: Contextual Retrieval')]),
        opt('hybrid', 'Hibrit arama', 'Anahtar kelime (BM25) ve vektör aramasını birleştir.', 3, 3, []),
      ],
    },
    {
      id: 'agents',
      title: 'Ajanlar',
      emoji: '🕹️',
      topics: [
        t('agent-basics', 'Ajan döngüsü', 'Planla → araç kullan → gözlemle; ne zaman ajan, ne zaman basit akış?', 2, 4, [doc('Anthropic: Building effective agents')]),
        t('mcp', 'Model Context Protocol (MCP)', 'Modelleri araç ve veri kaynaklarına standart yolla bağla.', 3, 4, [doc('modelcontextprotocol.io')]),
        opt('multi-agent', 'Çoklu ajan sistemleri', 'Görev dağıtımı, alt ajanlar, maliyet ve güvenilirlik dengesi.', 3, 4, []),
        t('guardrails', 'Güvenlik ve korumalar', 'Prompt enjeksiyonu, yetki sınırlama, insan onayı.', 3, 3, [doc('OWASP Top 10 for LLM Applications')]),
      ],
    },
    {
      id: 'ml',
      title: 'Makine öğrenmesi temelleri',
      emoji: '📈',
      topics: [
        opt('ml-basics', 'Klasik ML', 'Regresyon, sınıflandırma, eğitim/test ayrımı, aşırı öğrenme (scikit-learn).', 2, 10, [course('Google: Machine Learning Crash Course')]),
        opt('deep-learning', 'Derin öğrenme', 'Sinir ağları ve PyTorch ile model eğitme.', 3, 15, [course('fast.ai: Practical Deep Learning'), vid('Andrej Karpathy: Neural Networks: Zero to Hero')]),
        alt('fine-tuning', 'İnce ayar (fine-tuning)', 'Prompt ve RAG yetmediğinde modeli kendi verinle uyarlamak (LoRA).', 3, 8, [doc('Hugging Face: LLM Course')]),
      ],
    },
    {
      id: 'production',
      title: 'Canlıya alma',
      emoji: '🚢',
      topics: [
        t('cost-latency', 'Maliyet ve gecikme', 'Önbellek (prompt caching), küçük model seçimi, toplu işlem.', 3, 3, [doc('Anthropic: Prompt caching')]),
        t('observability', 'İzleme', 'Her çağrıyı logla, kaliteyi ve maliyeti takip et (Langfuse vb.).', 3, 3, [doc('Langfuse Docs')]),
        t('deploy', 'Servis olarak yayın', 'FastAPI ile API, Docker ve bulut; gizli anahtar yönetimi.', 2, 5, [doc('FastAPI Docs')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('project-rag', 'Proje: Belgelerinle sohbet', 'PDF yükle, sorulara kaynak göstererek cevap veren RAG uygulaması.', 2, 15, []),
        t('project-agent', 'Proje: Araç kullanan ajan', 'Takvim, arama ya da veritabanı araçlarıyla iş gören bir ajan; eval seti ile.', 3, 20, []),
        opt('portfolio', 'Paylaş ve anlat', 'Projelerini GitHub’da belgeleyip demo videosu ve yazı ile paylaş.', 2, 4, [prac('Hugging Face Spaces')]),
      ],
    },
  ],
};
