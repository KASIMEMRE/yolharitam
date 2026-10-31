import { book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const GIT: DevRoadmap = {
  id: 'git',
  kind: 'skill',
  title: 'Git ve GitHub',
  tagline: 'Kodunu sürümle, ekiple çalış, açık kaynağa katkı ver.',
  emoji: '🌿',
  hue: 'coral',
  sections: [
    {
      id: 'basics',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('why', 'Sürüm kontrolü nedir?', 'Değişiklik geçmişi, geri dönme ve birlikte çalışma ihtiyacı.', 1, 1, [doc('Pro Git: Başlangıç (kitap, ücretsiz)')]),
        t('setup', 'Kurulum ve yapılandırma', 'git config ile ad/e-posta, varsayılan dal adı, editör.', 1, 1, [book('Pro Git: Getting Started'), doc('Git Docs: git config')]),
        t('first-repo', 'İlk depo', 'init, status, add, commit; çalışma alanı, hazırlık alanı ve depo.', 1, 2, [prac('Learn Git Branching')]),
        t('history', 'Geçmişi incelemek', 'log, diff, show; iyi bir commit mesajı nasıl yazılır?', 1, 1, [book('Pro Git: Viewing the Commit History'), doc('Git Docs: git log')]),
        t('ignore', '.gitignore', 'Gizli dosyaları ve derleme çıktılarını depodan uzak tut.', 1, 1, [doc('github/gitignore şablonları')]),
      ],
    },
    {
      id: 'branching',
      title: 'Dallar',
      emoji: '🌳',
      topics: [
        t('branches', 'Dal oluşturma ve geçiş', 'branch, switch; her iş için ayrı dal.', 1, 2, [prac('Learn Git Branching')]),
        t('merge', 'Birleştirme ve çakışmalar', 'merge, fast-forward ve çakışma çözme.', 2, 2, [book('Pro Git: Basic Branching and Merging'), doc('GitHub Docs: Resolving a merge conflict')]),
        t('rebase', 'Rebase', 'Geçmişi düzenli tutmak; ne zaman rebase, ne zaman merge?', 2, 2, [book('Pro Git: Rebasing'), doc('Atlassian Git Tutorial: Merging vs. Rebasing')]),
        opt('stash', 'Stash ve cherry-pick', 'Yarım işi kenara koy, tek bir commit’i başka dala taşı.', 2, 1, [book('Pro Git: Stashing and Cleaning'), doc('Git Docs: git cherry-pick')]),
      ],
    },
    {
      id: 'remote',
      title: 'Uzak depolar ve GitHub',
      emoji: '☁️',
      topics: [
        t('remote', 'push, pull, fetch', 'Uzak depoyla senkronizasyon ve izleme dalları.', 1, 2, [book('Pro Git: Working with Remotes'), doc('GitHub Docs: Getting changes from a remote repository')]),
        t('ssh-auth', 'Kimlik doğrulama', 'SSH anahtarı ya da token ile güvenli bağlantı.', 1, 1, [doc('GitHub Docs: SSH')]),
        t('pr', 'Pull Request akışı', 'Dal aç → PR → inceleme → birleştir; iyi PR açıklaması.', 1, 2, [course('GitHub Skills')]),
        t('review', 'Kod incelemesi', 'Yorum yazma, değişiklik isteme, öneriyi uygulama.', 2, 2, [doc('GitHub Docs: About pull request reviews'), doc('Google Engineering Practices: Code Review')]),
        opt('issues-projects', 'Issue ve Projects', 'İş takibi, etiketler, kilometre taşları.', 1, 1, [doc('GitHub Docs: About issues'), doc('GitHub Docs: About Projects')]),
      ],
    },
    {
      id: 'advanced',
      title: 'İleri Git',
      emoji: '🏔️',
      topics: [
        t('undo', 'Geri alma', 'restore, reset, revert farkı; reflog ile kaybolanı bul.', 2, 2, [doc('Oh Shit, Git!?!')]),
        t('interactive-rebase', 'Etkileşimli rebase', 'Commit’leri birleştir, sırala, mesajlarını düzelt.', 3, 2, [book('Pro Git: Rewriting History'), doc('Git Docs: git rebase')]),
        opt('bisect', 'bisect ile hata avı', 'Hatayı getiren commit’i ikili aramayla bul.', 3, 1, [doc('Git Docs: git bisect'), book('Pro Git: Debugging with Git')]),
        opt('internals', 'Git’in iç yapısı', 'Nesneler (blob, tree, commit) ve referanslar.', 3, 3, [book('Pro Git: Git Internals')]),
        opt('hooks', 'Git hook’ları', 'Commit öncesi otomatik kontrol (Husky, pre-commit).', 3, 1, [book('Pro Git: Git Hooks'), doc('Husky Docs')]),
      ],
    },
    {
      id: 'workflows',
      title: 'Ekip akışları',
      emoji: '👥',
      topics: [
        t('strategies', 'Dallanma stratejileri', 'GitHub Flow, trunk-based ve GitFlow karşılaştırması.', 2, 2, [doc('Atlassian Git Tutorial: Comparing Workflows'), doc('Trunk Based Development')]),
        t('actions', 'GitHub Actions', 'Her push’ta test ve kontrol çalıştır.', 2, 3, [doc('GitHub Actions Docs')]),
        opt('semver', 'Sürümleme ve etiketler', 'Semantic Versioning, tag, GitHub Releases.', 2, 1, [doc('semver.org')]),
        opt('conventional', 'Conventional Commits', 'Standart commit mesajlarıyla otomatik değişiklik günlüğü.', 2, 1, [doc('conventionalcommits.org')]),
      ],
    },
    {
      id: 'open-source',
      title: 'Açık kaynak',
      emoji: '🌍',
      topics: [
        t('fork', 'Fork ile katkı', 'Fork → klon → dal → PR; upstream’i güncel tutma.', 2, 2, [prac('First Contributions (GitHub)')]),
        t('first-pr', 'İlk açık kaynak katkın', '“good first issue” bul, dokümantasyon ya da küçük bir hata düzeltmesiyle başla.', 2, 4, [prac('Good First Issue (goodfirstissue.dev)')]),
        opt('profile', 'GitHub profilin', 'README profili, sabitlenmiş projeler, düzenli katkı.', 1, 1, [doc('GitHub Docs: Managing your profile README'), doc('GitHub Docs: Customizing your profile')]),
      ],
    },
  ],
};
