import AppTabs from '@/components/app-tabs';

// İlk açılan sekme "Yol Haritam" olsun. Belirtmezsek web'de dosyalar alfabetik sıralanır ve
// "news" (Gelişmeler) öne geçer. Native sekmeler zaten tanım sırasını izler; orada da sonuç aynı.
export const unstable_settings = { initialRouteName: 'roadmap' };

// (tabs) klasöründeki ekranlar alttaki sekme çubuğuyla gösterilir.
// Parantezli klasör adresinde görünmez: (tabs)/roadmap.tsx -> "/roadmap"
export default function TabsLayout() {
  return <AppTabs />;
}
