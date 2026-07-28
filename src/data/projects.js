/**
 * Selected projects — YouTube IDs verified via oEmbed.
 */

function project({ id, title, youtubeId }) {
  return {
    id,
    title,
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    youtubeId,
    thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    descriptionTR: 'Seçili prodüksiyon çalışması.',
    descriptionEN: 'Selected production work.',
    status: 'published',
  };
}

export const projects = [
  project({ id: 'selam', title: 'KXRGX x AGAB — SELAM', youtubeId: 'qWKnHLvVrnI' }),
  project({ id: 'ichiban', title: 'KXRGX x AGAB — ICHIBAN', youtubeId: 'ugg5HtF-pcU' }),
  project({ id: 'deli', title: 'KXRGX x GÖKHAN TÜRKMEN — DELİ', youtubeId: 'Jz2MCpfPL0Q' }),
  project({ id: 'serefine', title: 'KXRGX x GÖKHAN TÜRKMEN — ŞEREFİNE', youtubeId: 'oWmcJCrVthE' }),
  project({ id: 'bir-baskasi', title: 'KXRGX x GÖKHAN TÜRKMEN — BİR BAŞKASI', youtubeId: 'u5WWgwrCYFA' }),
  project({ id: 'nanay', title: 'KXRGX x GÖKHAN TÜRKMEN — NANAY', youtubeId: 'nK4bClXyDjE' }),
  project({ id: 'sensiz-daha-guzel', title: 'KXRGX x GÖKHAN TÜRKMEN — SENSİZ DAHA GÜZEL', youtubeId: '8jJbhl1FQTI' }),
  project({ id: 'gani', title: 'AGAB — GANİ', youtubeId: '4xxPrLTBd8Y' }),
  project({ id: 'koku', title: 'AGAB — KOKU', youtubeId: 'WxgIx38ByLc' }),
  project({ id: '2k44', title: 'CURUM ENTERTAINMENT — 2K44', youtubeId: '6KNs3Sdzgdg' }),
  project({ id: 'hallederiz', title: 'KXRGX x AGAB — HALLEDERİZ', youtubeId: 'Z1WjVhPNfY4' }),
  project({ id: 'falancafilanci', title: 'KXRGX x DANTEFAZE — FALANCAFİLANCI', youtubeId: 'Izzc2Szt09k' }),
];
