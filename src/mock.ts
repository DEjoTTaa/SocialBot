import type { MediaItem } from "./meta.js";

const agora = Date.now();
function horasAtras(h: number): string {
  return new Date(agora - h * 3600_000).toISOString();
}

export interface MockFonte {
  username: string;
  seguidores: number;
  parceiro: boolean;
  posts: MediaItem[];
}

export const mockFontes: MockFonte[] = [
  {
    username: "mock_noticias",
    seguidores: 500_000,
    parceiro: false,
    posts: [
      {
        id: "mock_01",
        caption:
          "Mulher é v*tima de feminicíd*o após denunciar ex-marido três vezes. Justiça falhou.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock01",
        timestamp: horasAtras(2),
        like_count: 45000,
        comments_count: 8200,
      },
      {
        id: "mock_02",
        caption:
          "Homem é preso por m4tou cachorro a pauladas no interior de SP. Vizinhos filmaram a cena.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock02",
        timestamp: horasAtras(5),
        like_count: 32000,
        comments_count: 12000,
      },
      {
        id: "mock_03",
        caption:
          "Caso de est*pr* coletivo de adolescente gera revolta. Quatro suspeitos foram identificados.",
        media_type: "CAROUSEL_ALBUM",
        media_url: "",
        permalink: "https://instagram.com/p/mock03",
        timestamp: horasAtras(8),
        like_count: 60000,
        comments_count: 15000,
      },
      {
        id: "mock_04",
        caption:
          "Bombeiros resgatam cachorrinho preso em bueiro por 3 dias. Final feliz! 🐶",
        media_type: "VIDEO",
        thumbnail_url: "",
        permalink: "https://instagram.com/p/mock04",
        timestamp: horasAtras(10),
        like_count: 25000,
        comments_count: 3000,
      },
      {
        id: "mock_05",
        caption:
          "Homem encontra cachorro com a mesma roupa que ele no bar. A internet não aguenta 😂",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock05",
        timestamp: horasAtras(6),
        like_count: 80000,
        comments_count: 5000,
      },
      {
        id: "mock_06",
        caption:
          "Polícia apreende 77 galos de rinha e leva 50 pessoas à delegacia. Animais estavam em estado deplorável.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock06",
        timestamp: horasAtras(12),
        like_count: 18000,
        comments_count: 4500,
      },
      {
        id: "mock_07",
        caption:
          "Famosa influenciadora se despede de sua cachorra de 16 anos: 'Descanse em paz, minha melhor amiga'",
        media_type: "CAROUSEL_ALBUM",
        media_url: "",
        permalink: "https://instagram.com/p/mock07",
        timestamp: horasAtras(14),
        like_count: 120000,
        comments_count: 9000,
      },
    ],
  },
  {
    username: "mock_parceiro",
    seguidores: 200_000,
    parceiro: true,
    posts: [
      {
        id: "mock_08",
        caption:
          "Denúncia de maus-tratos em canil clandestino leva à apreensão de 30 cães. Acompanhamos o caso de perto.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock08",
        timestamp: horasAtras(4),
        like_count: 15000,
        comments_count: 2000,
      },
      {
        id: "mock_09",
        caption:
          "Reunião importante hoje no Congresso sobre o futuro da nossa nação. Obrigado pelo apoio de todos!",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock09",
        timestamp: horasAtras(20),
        like_count: 5000,
        comments_count: 800,
      },
    ],
  },
  {
    username: "mock_geral",
    seguidores: 300_000,
    parceiro: false,
    posts: [
      {
        id: "mock_10",
        caption:
          "Novo restaurante japonês abre na avenida Paulista com fila de 3 horas.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock10",
        timestamp: horasAtras(3),
        like_count: 10000,
        comments_count: 500,
      },
      {
        id: "mock_11",
        caption:
          "Resultado do jogo: Corinthians 2 x 1 Palmeiras no Derby paulista.",
        media_type: "VIDEO",
        thumbnail_url: "",
        permalink: "https://instagram.com/p/mock11",
        timestamp: horasAtras(7),
        like_count: 90000,
        comments_count: 20000,
      },
      {
        id: "mock_12",
        caption:
          "Sorteio de iPhone 16! Siga o perfil e marque 3 amigos para participar.",
        media_type: "IMAGE",
        media_url: "",
        permalink: "https://instagram.com/p/mock12",
        timestamp: horasAtras(1),
        like_count: 2000,
        comments_count: 15000,
      },
    ],
  },
];
