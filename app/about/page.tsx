import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import AboutContent from "./_components/AboutContent";
import { createClient } from "@supabase/supabase-js";
import type { AboutData } from "@/lib/supabase/types";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

export const revalidate = 60;

export const metadata = {
  title: "About Us — WellnessHub",
  description: "Your destination for wellness, beauty, and self-care in Oman.",
};

function buildFallback(): AboutData {
  const e = en.about;
  const a = ar.about;
  return {
    heroSubtitle:          { en: e.heroSubtitle,    ar: a.heroSubtitle },
    heroHeadline:          { en: e.heroHeadline,     ar: a.heroHeadline },
    heroBody:              { en: e.heroBody,         ar: a.heroBody },
    exploreServices:       { en: e.exploreServices,  ar: a.exploreServices },
    contactUs:             { en: e.contactUs,        ar: a.contactUs },
    heroImageUnsplashId:   "photo-1540555700478-4be289fbecef",
    heroImageUrl:          "",
    whoWeAre:              { en: e.whoWeAre,         ar: a.whoWeAre },
    missionHeadline:       { en: e.missionHeadline,  ar: a.missionHeadline },
    missionP1:             { en: e.missionP1,        ar: a.missionP1 },
    missionP2:             { en: e.missionP2,        ar: a.missionP2 },
    missionImageUnsplashId:"photo-1522337360788-8b13dee7a37e",
    missionImageUrl:       "",
    ourValues:             { en: e.ourValues,        ar: a.ourValues },
    valuesHeadline:        { en: e.valuesHeadline,   ar: a.valuesHeadline },
    val1Title:             { en: e.val1Title,        ar: a.val1Title },
    val1Body:              { en: e.val1Body,         ar: a.val1Body },
    val2Title:             { en: e.val2Title,        ar: a.val2Title },
    val2Body:              { en: e.val2Body,         ar: a.val2Body },
    val3Title:             { en: e.val3Title,        ar: a.val3Title },
    val3Body:              { en: e.val3Body,         ar: a.val3Body },
    stat1Value:            "5+",
    stat2Value:            "2,000+",
    stat3Value:            "30+",
    stat1:                 { en: e.stat1,            ar: a.stat1 },
    stat2:                 { en: e.stat2,            ar: a.stat2 },
    stat3:                 { en: e.stat3,            ar: a.stat3 },
    getInTouch:            { en: e.getInTouch,       ar: a.getInTouch },
    contactHeadline:       { en: e.contactHeadline,  ar: a.contactHeadline },
    location:              { en: e.location,         ar: a.location },
    locationValue:         { en: e.locationValue,    ar: a.locationValue },
    phone:                 { en: e.phone,            ar: a.phone },
    phoneValue:            { en: e.phoneValue,       ar: a.phoneValue },
    instagram:             { en: e.instagram,        ar: a.instagram },
    instagramValue:        { en: e.instagramValue,   ar: a.instagramValue },
    hours:                 { en: e.hours,            ar: a.hours },
    hoursValue:            { en: e.hoursValue,       ar: a.hoursValue },
    bookNow:               { en: e.bookNow,          ar: a.bookNow },
  };
}

async function getAboutData(): Promise<AboutData> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("about_settings")
      .select("content")
      .limit(1)
      .single();
    if (error || !data) return buildFallback();
    return data.content as AboutData;
  } catch {
    return buildFallback();
  }
}

export default async function AboutPage() {
  const data = await getAboutData();

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-light">
      <Nav />
      <div className="pt-16">
        <AboutContent data={data} />
      </div>
      <Footer />
    </main>
  );
}
