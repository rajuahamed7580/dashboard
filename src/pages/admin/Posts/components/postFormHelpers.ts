import type { Post, PostImage } from '../../../../types';

export interface PostFormValues {
  title: string;
  slug: string;
  displayName: string;
  category: string;
  age: number;
  gender: string;
  ethnicity: string;
  height: string;
  bodyType: string;
  serviceType: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  donations: string;
  paymentMethods: string;
  mainImage: string;
  images: PostImage[];
  eyes: string;
  hair: string;
  hairLength: string;
  grooming: string;
  chest: string;
  piercings: boolean;
  tattoos: boolean;
  smoke: boolean;
  aboutNotice: string;
  aboutWarnings: string;
  noList: string;
  workingHours: string;
  workingDays: string;
  screeningRequirements: string;
  depositAmount: string;
  screeningInstructions: string;
}

export const DEFAULT_POST_FORM: PostFormValues = {
  title: '',
  slug: '',
  displayName: '',
  category: 'Escort',
  age: 25,
  gender: 'Female',
  ethnicity: 'White',
  height: '5 ft 7 in',
  bodyType: 'Curvy',
  serviceType: 'Incall, Outcall',
  city: 'Norwalk',
  state: 'California',
  country: 'USA',
  phone: '(408) 403-1569',
  donations: 'Ask',
  paymentMethods: 'Cash, Paypal, Zelle, Apple Pay',
  mainImage:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  images: [],
  eyes: 'Brown',
  hair: 'White',
  hairLength: 'To butt',
  grooming: 'Bald',
  chest: '30 - 32 DD',
  piercings: false,
  tattoos: false,
  smoke: false,
  aboutNotice:
    "🚗💨 OUTCALLS require 60 Deposit 🚗💨 I'll make the drive if you make the deposit!! ❤️",
  aboutWarnings: '⚠️ 🚫No Gpe 🚫No service 🚫No gfe 🚫No bbbi 🚫No Bare ⚠️',
  noList: 'BBBJ, DFK, COF, FOV, CIM, LFK, RIV, DATY',
  workingHours: '10:00 AM - 11:00 PM',
  workingDays: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
  screeningRequirements:
    'Two references from recognized providers or employment & LinkedIn verification.',
  depositAmount: '$60 for outcalls',
  screeningInstructions:
    'Please text with your name, screening info, date, time and duration requested.'
};

export function postToFormValues(p: Post): PostFormValues {
  return {
    title: p.title || '',
    slug: p.slug || '',
    displayName: p.displayName || '',
    category: p.category || 'Escort',
    age: p.age ?? 25,
    gender: p.gender || 'Female',
    ethnicity: p.ethnicity || 'White',
    height: p.height || '5 ft 7 in',
    bodyType: p.bodyType || 'Curvy',
    serviceType: Array.isArray(p.serviceType) ? p.serviceType.join(', ') : 'Incall, Outcall',
    city: p.location?.city || '',
    state: p.location?.state || '',
    country: p.location?.country || 'USA',
    phone: p.contact?.phone || '',
    donations: p.donations || 'Ask',
    paymentMethods: Array.isArray(p.paymentMethods) ? p.paymentMethods.join(', ') : '',
    mainImage: p.mainImage || '',
    images: p.images || [],
    eyes: p.attributes?.eyes || '',
    hair: p.attributes?.hair || '',
    hairLength: p.attributes?.hairLength || '',
    grooming: p.attributes?.grooming || '',
    chest: p.attributes?.chest || '',
    piercings: Boolean(p.attributes?.piercings),
    tattoos: Boolean(p.attributes?.tattoos),
    smoke: Boolean(p.attributes?.smoke),
    aboutNotice: p.aboutSection?.notice || '',
    aboutWarnings: p.aboutSection?.warnings || '',
    noList: Array.isArray(p.aboutSection?.noList) ? p.aboutSection.noList.join(', ') : '',
    workingHours: p.scheduleSection?.workingHours || '',
    workingDays: Array.isArray(p.scheduleSection?.workingDays)
      ? p.scheduleSection.workingDays.join(', ')
      : '',
    screeningRequirements: p.screeningSection?.requirements || '',
    depositAmount: p.screeningSection?.depositAmount || '',
    screeningInstructions: p.screeningSection?.instructions || ''
  };
}

export function formValuesToPayload(form: PostFormValues): Record<string, unknown> {
  const imagesPayload =
    form.images.length > 0
      ? form.images
      : form.mainImage
      ? [{ url: form.mainImage, caption: 'Main photo', isMain: true }]
      : [];

  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    displayName: form.displayName.trim(),
    category: form.category.trim(),
    age: Number(form.age),
    gender: form.gender.trim(),
    ethnicity: form.ethnicity.trim(),
    height: form.height.trim(),
    bodyType: form.bodyType.trim(),
    serviceType: form.serviceType
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    mainImage: form.mainImage.trim() || imagesPayload[0]?.url || '',
    images: imagesPayload,
    location: {
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      formattedLocation: `${form.country.trim()} > ${form.state.trim()} > ${form.city.trim()} 📍`
    },
    contact: {
      phone: form.phone.trim()
    },
    donations: form.donations.trim(),
    paymentMethods: form.paymentMethods
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    attributes: {
      eyes: form.eyes.trim(),
      hair: form.hair.trim(),
      hairLength: form.hairLength.trim(),
      grooming: form.grooming.trim(),
      chest: form.chest.trim(),
      piercings: form.piercings,
      tattoos: form.tattoos,
      smoke: form.smoke
    },
    aboutSection: {
      notice: form.aboutNotice,
      warnings: form.aboutWarnings,
      noList: form.noList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    },
    scheduleSection: {
      workingHours: form.workingHours,
      workingDays: form.workingDays
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    },
    screeningSection: {
      requirements: form.screeningRequirements,
      depositRequired: true,
      depositAmount: form.depositAmount,
      instructions: form.screeningInstructions
    }
  };
}
