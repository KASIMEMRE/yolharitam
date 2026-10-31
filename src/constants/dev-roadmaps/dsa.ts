import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const DSA: DevRoadmap = {
  id: 'dsa',
  kind: 'skill',
  title: 'Veri Yapıları ve Algoritmalar',
  tagline: 'Problemleri verimli çöz; iş görüşmelerine hazırlan.',
  emoji: '🧠',
  hue: 'violet',
  sections: [
    {
      id: 'foundations',
      title: 'Temeller',
      emoji: '🌱',
      topics: [
        t('big-o', 'Big-O notasyonu', 'Bir algoritmanın girdi büyüdükçe ne kadar yavaşladığını anlatan ortak dil.', 1, 3, [vid('Big-O Notation (CS Dojo, YouTube)'), book('Grokking Algorithms')]),
        t('space-complexity', 'Zaman ve bellek dengesi', 'Hızlanmak için bellek harcamak: en kötü, ortalama durum ve ödünleşimler.', 1, 2, [doc('Big-O Cheat Sheet'), book('Grokking Algorithms')]),
        t('arrays', 'Diziler', 'Ardışık bellekte indeksle erişim; ekleme, silme ve iki işaretçi tekniği.', 1, 3, [prac('LeetCode: Array 101'), course('freeCodeCamp: Data Structures and Algorithms')]),
        t('strings', 'String işlemleri', 'Karakter dizilerinde arama, tersine çevirme, palindrom ve kayan pencere örnekleri.', 1, 3, [prac('LeetCode: Strings'), prac('NeetCode: Arrays and Hashing')]),
      ],
    },
    {
      id: 'linear',
      title: 'Doğrusal yapılar',
      emoji: '🔗',
      topics: [
        t('linked-list', 'Bağlı liste', 'Düğümlerin birbirine işaretçiyle bağlandığı yapı; ekleme kolay, erişim yavaştır.', 1, 4, [prac('LeetCode: Linked List'), vid('Linked Lists (mycodeschool, YouTube)')]),
        t('stack', 'Yığın (stack)', 'Son giren ilk çıkar (LIFO); parantez denetimi ve geri alma gibi işlerde kullanılır.', 1, 2, [prac('LeetCode: Stack'), course('freeCodeCamp: Data Structures and Algorithms')]),
        t('queue', 'Kuyruk (queue)', 'İlk giren ilk çıkar (FIFO); deque ve öncelikli kuyruğa giden yol.', 1, 2, [prac('LeetCode: Queue'), book('Grokking Algorithms')]),
        t('hash-table', 'Hash tablosu', 'Anahtarla ortalama O(1) erişim; çakışma çözümü ve sayma/arama problemlerinin en güçlü aracı.', 1, 4, [prac('NeetCode: Arrays and Hashing'), doc('CS50: Hash Tables')]),
      ],
    },
    {
      id: 'sorting-searching',
      title: 'Sıralama ve arama',
      emoji: '🔍',
      topics: [
        t('binary-search', 'İkili arama', 'Sıralı veride aralığı her adımda yarıya indirerek O(log n) sürede bulma.', 1, 3, [prac('LeetCode: Binary Search'), vid('Binary Search (CS50, YouTube)')]),
        t('simple-sorts', 'Basit sıralamalar', 'Kabarcık, seçme ve ekleme sıralaması; yavaş ama sıralama mantığını öğretir.', 1, 2, [vid('Sorting Algorithms Visualized (YouTube)'), course('freeCodeCamp: Data Structures and Algorithms')]),
        t('merge-quick', 'Merge ve Quick Sort', 'Böl ve yönet ile O(n log n) sıralama; kararlılık ve en kötü durum farkları.', 2, 4, [book('Grokking Algorithms'), prac('LeetCode: Sorting')]),
        opt('other-sorts', 'Heap, counting ve radix sort', 'Özel durumlarda daha hızlı ya da yer tasarruflu sıralama yöntemleri.', 3, 3, [doc('Visualgo: Sorting')]),
      ],
    },
    {
      id: 'recursion',
      title: 'Özyineleme ve geri izleme',
      emoji: '🔁',
      topics: [
        t('recursion', 'Özyineleme', 'Fonksiyonun kendini çağırması; taban durum, çağrı yığını ve problemi küçültme.', 2, 4, [prac('LeetCode: Recursion I'), vid('Recursion (CS50, YouTube)')]),
        t('divide-conquer', 'Böl ve yönet', 'Problemi eş parçalara ayırıp çöz, sonuçları birleştir; merge sort bunun örneğidir.', 2, 3, [book('Grokking Algorithms'), prac('LeetCode: Divide and Conquer')]),
        t('backtracking', 'Geri izleme (backtracking)', 'Tüm olasılıkları dene, çıkmaza girince geri dön: permütasyon, N-Vezir, sudoku.', 3, 5, [prac('NeetCode: Backtracking'), prac('LeetCode: Backtracking')]),
      ],
    },
    {
      id: 'trees',
      title: 'Ağaçlar',
      emoji: '🌳',
      topics: [
        t('tree-basics', 'Ağaç yapısı ve gezinti', 'Kök, yaprak, derinlik; preorder, inorder, postorder ve seviye sırası gezintisi.', 2, 4, [prac('LeetCode: Binary Tree'), course('freeCodeCamp: Data Structures and Algorithms')]),
        t('bst', 'İkili arama ağacı (BST)', 'Sol küçük, sağ büyük kuralıyla arama/ekleme; dengesizse O(n) olabilir.', 2, 4, [prac('LeetCode: Binary Search Tree'), vid('Binary Search Tree (mycodeschool, YouTube)')]),
        t('heap', 'Heap ve öncelikli kuyruk', 'En küçük ya da en büyük elemana hızlı erişim; “en iyi K” türü sorularda sık çıkar.', 2, 3, [prac('NeetCode: Heap / Priority Queue'), doc('Python Docs: heapq')]),
        opt('trie', 'Trie', 'Önek ağacı; otomatik tamamlama ve sözlük aramaları için çok verimlidir.', 3, 3, [prac('LeetCode: Trie'), prac('NeetCode: Tries')]),
        opt('balanced-trees', 'Dengeli ağaçlar', 'AVL ve kırmızı-siyah ağaç fikri: ağacı dengede tutup O(log n) garantisi vermek.', 3, 3, [doc('Visualgo: AVL Tree'), book('Introduction to Algorithms (CLRS)')]),
      ],
    },
    {
      id: 'graphs',
      title: 'Graflar',
      emoji: '🗺️',
      topics: [
        t('graph-basics', 'Graf temsili', 'Düğüm ve kenar; komşuluk listesi ile matris arasındaki seçim, yönlü ve ağırlıklı graflar.', 2, 3, [prac('NeetCode: Graphs'), course('freeCodeCamp: Data Structures and Algorithms')]),
        t('bfs-dfs', 'BFS ve DFS', 'Genişlik ve derinlik öncelikli gezinti; ada sayma, labirent ve bağlantı sorularının temeli.', 2, 5, [prac('LeetCode: Graph'), vid('Graph Algorithms (William Fiset, YouTube)')]),
        t('shortest-path', 'En kısa yol', 'Dijkstra ile ağırlıklı graflarda en kısa yol; BFS ile ağırlıksız durum.', 3, 5, [vid('Dijkstra’s Algorithm (Computerphile, YouTube)'), prac('LeetCode: Network Delay Time')]),
        t('topological-sort', 'Topolojik sıralama', 'Bağımlılık sıralaması: ders programı ve derleme sırası gibi döngüsüz graf problemleri.', 3, 3, [prac('LeetCode: Course Schedule'), prac('NeetCode: Graphs')]),
        opt('union-find', 'Union-Find', 'Kümeleri hızlıca birleştirme ve aynı kümede mi diye sorma; bağlı bileşenler için.', 3, 3, [prac('LeetCode: Number of Provinces'), doc('Visualgo: Union-Find')]),
      ],
    },
    {
      id: 'paradigms',
      title: 'Problem çözme yaklaşımları',
      emoji: '🧩',
      topics: [
        t('two-pointers-window', 'İki işaretçi ve kayan pencere', 'Doğrusal taramayla iç içe döngüleri kaldıran iki kalıp; sık sorulur.', 2, 4, [prac('NeetCode: Two Pointers'), prac('NeetCode: Sliding Window')]),
        t('dp-basics', 'Dinamik programlama', 'Alt problemleri bir kez çöz, sakla: memoization ve tabulation ile Fibonacci, merdiven.', 3, 8, [vid('Dynamic Programming (freeCodeCamp, YouTube)'), prac('LeetCode: Dynamic Programming')]),
        t('dp-classics', 'Klasik DP problemleri', 'Sırt çantası, en uzun ortak altdizi, para bozma; kalıpları tanımayı öğren.', 3, 8, [prac('NeetCode: 1-D and 2-D DP'), book('Introduction to Algorithms (CLRS)')]),
        t('greedy', 'Açgözlü algoritmalar', 'Her adımda en iyi görünen seçimi yap; ne zaman doğru sonuç verdiğini kanıtlamayı öğren.', 3, 5, [prac('NeetCode: Greedy'), prac('LeetCode: Greedy')]),
        alt('bit-manipulation', 'Bit işlemleri', 'AND, OR, XOR ve kaydırma ile bellek ve hız kazandıran akıllıca çözümler.', 3, 3, [prac('NeetCode: Bit Manipulation')]),
      ],
    },
    {
      id: 'interview',
      title: 'Görüşme pratiği / kariyer',
      emoji: '🎯',
      topics: [
        t('pattern-practice', 'Kalıp kalıp pratik', 'Soruları konuya göre çöz (Blind 75, NeetCode 150); ezber değil kalıp tanı.', 3, 30, [prac('NeetCode 150'), prac('LeetCode')]),
        t('mock-interview', 'Sesli düşünme ve deneme görüşmesi', 'Çözümü anlatarak yaz, önce basit yöntemi sun, sonra iyileştir; arkadaşınla prova yap.', 3, 6, [book('Cracking the Coding Interview'), prac('Pramp')]),
        opt('system-design', 'Sistem tasarımına giriş', 'Ölçeklenen sistemleri çizme; kıdemli görüşmelerde algoritmalar kadar önemlidir.', 3, 10, [book('Designing Data-Intensive Applications'), course('System Design Primer (GitHub)')]),
      ],
    },
  ],
};
