export type PriceTier = {
  label: string;
  price: string;
  numericPrice: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  price?: string;
  numericPrice?: number;
  tiers?: PriceTier[];
  note?: string;
  unsplashId?: string;
  icon?: string;
};

export type SubCategory = {
  title: string;
  items: ServiceItem[];
  note?: string;
};

export type Category = {
  id: string;
  title: string;
  subtitle: string;
  unsplashId: string;
  imageUrl?: string;
  subs: SubCategory[];
};

export const categories: Category[] = [
  {
    id: "fitness",
    title: "Fitness & Dance",
    subtitle: "Classes for every level",
    unsplashId: "photo-1518611012118-696072aa579a",
    subs: [
      {
        title: "Indian Zumba / Oriental Dance",
        items: [
          {
            id: "zumba-8",
            name: "8 Sessions",
            description: "An energetic 8-session bundle of Indian Zumba or Oriental Dance — perfect for beginners looking to build rhythm and fitness.",
            price: "40 OMR",
            numericPrice: 40,
            unsplashId: "photo-1518611012118-696072aa579a",
          },
          {
            id: "zumba-10",
            name: "10 Sessions",
            description: "Commit to 10 sessions and feel the difference. Ideal for those building consistency in their dance fitness routine.",
            price: "45 OMR",
            numericPrice: 45,
            unsplashId: "photo-1518611012118-696072aa579a",
          },
          {
            id: "zumba-12",
            name: "12 Sessions",
            description: "Our best-value dance bundle. 12 high-energy sessions designed to transform your fitness and confidence.",
            price: "55 OMR",
            numericPrice: 55,
            unsplashId: "photo-1518611012118-696072aa579a",
          },
        ],
      },
      {
        title: "Fitness",
        items: [
          {
            id: "fitness-monthly",
            name: "Monthly Subscription",
            description: "Unlimited gym access for a full month. Use our state-of-the-art equipment and attend group classes on your schedule.",
            price: "35 OMR",
            numericPrice: 35,
            unsplashId: "photo-1571019614242-c5c5dee9f50b",
          },
        ],
      },
    ],
  },
  {
    id: "salon",
    title: "Salon & Beauty",
    subtitle: "Hair, skin, and makeup",
    unsplashId: "photo-1560066984-138dadb4c035",
    subs: [
      {
        title: "Hair & Skin Care",
        items: [
          {
            id: "hair-mask",
            name: "Natural & Treatment Hair Masks",
            description: "Deep-conditioning hair masks using natural ingredients that restore shine, strength, and moisture to all hair types.",
            price: "15 OMR",
            numericPrice: 15,
            unsplashId: "photo-1522337360788-8b13dee7a37e",
          },
          {
            id: "face-mask",
            name: "Natural & Treatment Face Masks",
            description: "Soothing face masks tailored to your skin type — cleanse, hydrate, and revive your complexion.",
            price: "5 OMR",
            numericPrice: 5,
            unsplashId: "photo-1570172619644-dfd03ed5d881",
          },
          {
            id: "hair-massage",
            name: "Hair Care Session with Massage",
            description: "A luxurious scalp massage paired with a professional hair treatment to relieve tension and nourish your hair from root to tip.",
            tiers: [
              { label: "30 minutes", price: "20 OMR", numericPrice: 20 },
              { label: "60 minutes", price: "30 OMR", numericPrice: 30 },
            ],
            unsplashId: "photo-1522337360788-8b13dee7a37e",
          },
        ],
      },
      {
        title: "Hair & Face Services",
        items: [
          {
            id: "blow-dry",
            name: "Blow Dry",
            description: "A professional blow-dry that leaves your hair smooth, voluminous, and styled to perfection.",
            price: "from 4 OMR",
            numericPrice: 4,
            unsplashId: "photo-1560066984-138dadb4c035",
          },
          {
            id: "threading-full",
            name: "Full Face & Eyebrow Threading",
            description: "Precise threading for a clean, defined brow shape and smooth facial finish.",
            price: "5 OMR",
            numericPrice: 5,
            unsplashId: "photo-1512207736890-6ffed8a84e8d",
          },
          {
            id: "threading-face",
            name: "Face Threading Only",
            description: "Quick and effective facial threading for a flawless, hair-free complexion.",
            price: "3 OMR",
            numericPrice: 3,
            unsplashId: "photo-1512207736890-6ffed8a84e8d",
          },
          {
            id: "hair-color",
            name: "Hair Coloring & Bleaching",
            description: "Expert coloring and bleaching services to achieve the shade you have always wanted.",
            price: "3 OMR",
            numericPrice: 3,
            unsplashId: "photo-1560066984-138dadb4c035",
          },
        ],
      },
      {
        title: "Eyelashes",
        items: [
          {
            id: "lash-half",
            name: "Half Lash Extension",
            description: "Subtle and natural-looking half lash extensions that open up your eyes without overdoing it.",
            price: "15 OMR",
            numericPrice: 15,
            unsplashId: "photo-1516975080664-ed2fc6a32937",
          },
          {
            id: "lash-full",
            name: "Full Lash Extension",
            description: "Dramatic, full lash extensions applied by our certified technicians for a bold, long-lasting look.",
            price: "25 OMR",
            numericPrice: 25,
            unsplashId: "photo-1516975080664-ed2fc6a32937",
          },
          {
            id: "lash-corner",
            name: "Corner Lash Extension",
            description: "Strategically placed corner lashes to create a beautiful cat-eye effect.",
            price: "10 OMR",
            numericPrice: 10,
            unsplashId: "photo-1516975080664-ed2fc6a32937",
          },
        ],
      },
      {
        title: "Makeup",
        items: [
          {
            id: "makeup-full",
            name: "Full Makeup with Lashes",
            description: "A complete makeup application including foundation, contouring, eye shadow, and full lash set — ready for any occasion.",
            price: "20 OMR",
            numericPrice: 20,
            unsplashId: "photo-1487412720507-e7ab37603c6f",
          },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Beauty",
    subtitle: "Permanent makeup & skin treatments",
    unsplashId: "photo-1576091160399-112ba8d25d1d",
    subs: [
      {
        title: "Permanent Makeup",
        items: [
          {
            id: "microblading",
            name: "Eyebrow Microblading",
            description: "Semi-permanent microblading technique that creates natural-looking hair strokes for perfectly defined brows that last up to 18 months.",
            price: "70 OMR",
            numericPrice: 70,
            unsplashId: "photo-1512207736890-6ffed8a84e8d",
          },
          {
            id: "perm-eyeliner",
            name: "Permanent Eyeliner",
            description: "Wake up with defined eyes every day. Our permanent eyeliner gives you a clean, precise line that stays through any activity.",
            price: "50 OMR",
            numericPrice: 50,
            unsplashId: "photo-1516975080664-ed2fc6a32937",
          },
          {
            id: "lip-blush",
            name: "Lip Blush",
            description: "A subtle tint and shape enhancement for your lips using advanced pigmentation techniques — natural color, all day.",
            price: "80 OMR",
            numericPrice: 80,
            unsplashId: "photo-1487412720507-e7ab37603c6f",
          },
        ],
      },
      {
        title: "Facial Treatments",
        items: [
          {
            id: "facial-thermal",
            name: "Facial with Thermal Mask",
            description: "A deeply relaxing facial treatment featuring a warming thermal mask that opens pores and infuses skin with active nutrients.",
            price: "50 OMR",
            numericPrice: 50,
            unsplashId: "photo-1570172619644-dfd03ed5d881",
          },
          {
            id: "facial-lavender",
            name: "Lavender & Cocoa Facial",
            description: "Indulge in our signature lavender and cocoa butter facial — nourishing, calming, and designed to leave skin luminous.",
            price: "40 OMR",
            numericPrice: 40,
            unsplashId: "photo-1576091160399-112ba8d25d1d",
          },
          {
            id: "deep-cleanse",
            name: "Deep Skin Cleansing",
            description: "A thorough deep-cleanse treatment that removes impurities, unclogs pores, and resets your skin's natural balance.",
            price: "30 OMR",
            numericPrice: 30,
            unsplashId: "photo-1576091160399-112ba8d25d1d",
          },
        ],
      },
      {
        title: "Skin Treatment Technologies",
        items: [
          {
            id: "microneedling",
            name: "Microneedling",
            description: "Collagen-induction therapy using fine needles to stimulate skin renewal, reduce scars, and improve overall texture.",
            tiers: [
              { label: "Single Session", price: "35 OMR", numericPrice: 35 },
              { label: "3 Sessions", price: "85 OMR", numericPrice: 85 },
            ],
            unsplashId: "photo-1576091160399-112ba8d25d1d",
          },
          {
            id: "mesotherapy",
            name: "Mesotherapy (DNA Salmon)",
            description: "Bio-revitalizing mesotherapy using PDRN (salmon DNA) to deeply hydrate, firm, and repair skin at the cellular level.",
            tiers: [
              { label: "Single Session", price: "45 OMR", numericPrice: 45 },
              { label: "3 Sessions", price: "120 OMR", numericPrice: 120 },
            ],
            unsplashId: "photo-1576091160399-112ba8d25d1d",
          },
          {
            id: "plasma-jet",
            name: "Skin Tightening (Plasma Jet)",
            description: "Non-surgical plasma technology to tighten skin, reduce fine lines, and lift sagging areas without downtime.",
            tiers: [
              { label: "Single Session", price: "35 OMR", numericPrice: 35 },
              { label: "3 Sessions", price: "90 OMR", numericPrice: 90 },
            ],
            unsplashId: "photo-1576091160399-112ba8d25d1d",
          },
        ],
      },
      {
        title: "Advanced Hair Care",
        items: [
          {
            id: "haircut-taichi",
            name: "Professional Haircut (Taichi)",
            description: "A precision haircut by our certified Taichi technique stylists — tailored to your face shape and lifestyle.",
            price: "15 – 40 OMR",
            numericPrice: 15,
            unsplashId: "photo-1560066984-138dadb4c035",
          },
          {
            id: "hair-meso",
            name: "Hair Mesotherapy",
            description: "Targeted micro-injections of vitamins and growth factors directly into the scalp to combat hair loss and boost density.",
            tiers: [
              { label: "Single Session", price: "35 OMR", numericPrice: 35 },
              { label: "3 Sessions", price: "90 OMR", numericPrice: 90 },
            ],
            unsplashId: "photo-1522337360788-8b13dee7a37e",
          },
        ],
      },
    ],
  },
  {
    id: "nails",
    title: "Nail Services",
    subtitle: "Extensions, lamination & care",
    unsplashId: "photo-1604654894610-df63bc536371",
    subs: [
      {
        title: "Nail Extensions (Poly Gel)",
        items: [
          {
            id: "poly-polish",
            name: "With Nail Polish",
            description: "Poly gel nail extensions finished with a classic nail polish — durable, lightweight, and natural-looking.",
            price: "20 OMR",
            numericPrice: 20,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
          {
            id: "poly-magnetic",
            name: "With Magnetic Effect",
            description: "Poly gel extensions with a stunning magnetic chrome effect that catches the light beautifully.",
            price: "25 OMR",
            numericPrice: 25,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
        note: "Safe for nails and suitable for sensitive skin",
      },
      {
        title: "Nail Lamination",
        items: [
          {
            id: "lam-polish",
            name: "Nail Lamination with Polish",
            description: "A strengthening lamination treatment with a polished finish — protects natural nails while adding a glossy sheen.",
            price: "15 OMR",
            numericPrice: 15,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
          {
            id: "lam-magnetic",
            name: "Nail Lamination with Magnetic Effect",
            description: "Lamination treatment paired with a magnetic chrome powder for an eye-catching multidimensional finish.",
            price: "20 OMR",
            numericPrice: 20,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
      },
      {
        title: "Nail Strengthening",
        items: [
          {
            id: "nail-strengthen",
            name: "Long Nail Strengthening with Poly Gel",
            description: "Reinforce and protect long natural nails with a flexible poly gel overlay — no extensions needed.",
            price: "15 OMR",
            numericPrice: 15,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
      },
      {
        title: "Hand Care",
        items: [
          {
            id: "hand-care",
            name: "Hand Cleaning + Massage",
            description: "A refreshing hand exfoliation and moisturizing massage to soften skin and relieve tension in hands and wrists.",
            price: "5 OMR",
            numericPrice: 5,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
      },
      {
        title: "Foot Care",
        items: [
          {
            id: "pedicure",
            name: "Pedicure",
            description: "A complete pedicure including soaking, exfoliation, cuticle care, nail shaping, and a relaxing foot massage.",
            price: "12 OMR",
            numericPrice: 12,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
      },
      {
        title: "Toenail Polish",
        items: [
          {
            id: "toe-regular",
            name: "Regular Toenail Polish",
            description: "Classic toenail polish applied with precision — choose from our wide range of colors.",
            price: "10 OMR",
            numericPrice: 10,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
          {
            id: "toe-magnetic",
            name: "Magnetic Toenail Polish",
            description: "Magnetic nail polish for toes creating a unique dimensional wave or star effect that is truly unique.",
            price: "12 OMR",
            numericPrice: 12,
            unsplashId: "photo-1604654894610-df63bc536371",
          },
        ],
      },
    ],
  },
];
