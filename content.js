/**
 * İçerik buradan yönetilir.
 * title değiştirdiğinizde görsel başlık, meta ve player otomatik güncellenir.
 *
 * GÖRSELLER — public/projects/ klasörüne koyun:
 *   1. agab-magnolia.jpg      → AGAB — Magnolia Albümü
 *   2. gokhan-dans-et.jpg     → Gökhan Türkmen — Dans Et
 *   3. 2k44.jpg               → 2K44 — Ft. Vlim, Sosa, Lask, Mado, Esat
 *
 * Müzikler → public/music/
 */

export const PROJECTS = [
  {
    badge: 'AG',
    title: 'AGAB — Magnolia Albümü',
    type: 'Albüm',
    artist: 'AGAB',
    description: 'AGAB ile geliştirilen Magnolia albümünde prodüksiyon, aranje ve atmosferik düzenleme.',
    tags: ['Albüm', 'Prodüksiyon', 'İşbirliği'],
    contour: 'contour-ellipses',
    image: '/projects/agab-magnolia.jpg',
    audio: '/music/agab-magnolia.mp3',
  },
  {
    badge: 'GT',
    title: 'Gökhan Türkmen — Dans Et',
    type: 'Single',
    artist: 'Gökhan Türkmen',
    description: "Gökhan Türkmen ile Dans Et single'ında modern prodüksiyon ve ritmik düzenleme.",
    tags: ['Single', 'Prodüksiyon', 'Pop'],
    contour: 'contour-flow',
    image: '/projects/gokhan-dans-et.jpg',
    audio: '/music/gokhan-dans-et.mp3',
  },
  {
    badge: '2K',
    title: '2K44 — Ft. Vlim, Sosa, Lask, Mado, Esat',
    type: 'Single',
    artist: '2K44',
    description: 'Vlim, Sosa, Lask, Mado ve Esat ile 2K44 single\'ında çoklu sanatçı prodüksiyonu.',
    tags: ['Single', 'İşbirliği', 'Hip-Hop'],
    contour: 'contour-grid',
    image: '/projects/2k44.jpg',
    audio: '/music/2k44.mp3',
  },
];

/** Anasayfa müziği — public/music/home.mp3 */
export const HOMEPAGE_MUSIC = {
  src: '/music/home.mp3',
  title: 'KXRGX',
};
