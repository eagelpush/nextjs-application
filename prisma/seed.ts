import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Pakistani cities and regions
const PAKISTANI_CITIES = [
  { city: "Karachi", region: "Sindh", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Lahore", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Islamabad", region: "Islamabad Capital Territory", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Faisalabad", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Rawalpindi", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Multan", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Peshawar", region: "Khyber Pakhtunkhwa", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Quetta", region: "Balochistan", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Sialkot", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
  { city: "Gujranwala", region: "Punjab", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi" },
];

// Pakistani names
const PAKISTANI_NAMES = [
  { firstName: "Ahmed", lastName: "Khan" },
  { firstName: "Fatima", lastName: "Ali" },
  { firstName: "Hassan", lastName: "Raza" },
  { firstName: "Ayesha", lastName: "Malik" },
  { firstName: "Usman", lastName: "Sheikh" },
  { firstName: "Zainab", lastName: "Hussain" },
  { firstName: "Bilal", lastName: "Iqbal" },
  { firstName: "Sana", lastName: "Ahmed" },
  { firstName: "Omar", lastName: "Butt" },
  { firstName: "Hira", lastName: "Chaudhry" },
];

// Pakistani store names
const PAKISTANI_STORES = [
  { storeName: "Karachi Fashion Hub", subdomain: "karachi-fashion", storeUrl: "https://karachi-fashion.myshopify.com" },
  { storeName: "Lahore Electronics", subdomain: "lahore-electronics", storeUrl: "https://lahore-electronics.myshopify.com" },
  { storeName: "Islamabad Textiles", subdomain: "islamabad-textiles", storeUrl: "https://islamabad-textiles.myshopify.com" },
  { storeName: "Punjab Handicrafts", subdomain: "punjab-handicrafts", storeUrl: "https://punjab-handicrafts.myshopify.com" },
  { storeName: "Sindh Spices", subdomain: "sindh-spices", storeUrl: "https://sindh-spices.myshopify.com" },
];

export async function main() {
  console.log("🌱 Starting seed with Pakistani data...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.campaignSend.deleteMany();
  await prisma.campaignAnalytics.deleteMany();
  await prisma.campaignSegment.deleteMany();
  await prisma.campaignHeroImage.deleteMany();
  await prisma.campaignCompanyLogo.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.segmentCondition.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.customAttribute.deleteMany();
  await prisma.optInAnalytics.deleteMany();
  await prisma.optInSettings.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.merchant.deleteMany();

  // Create Merchants with Pakistani data
  console.log("👤 Creating merchants...");
  const merchants = [];

  for (let i = 0; i < PAKISTANI_STORES.length; i++) {
    const store = PAKISTANI_STORES[i];
    const name = PAKISTANI_NAMES[i % PAKISTANI_NAMES.length];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@${store.subdomain}.pk`;

    const merchant = await prisma.merchant.create({
      data: {
        clerkId: `clerk_${i + 1}_${Date.now()}`,
        email: email,
        firstName: name.firstName,
        lastName: name.lastName,
        emailVerified: new Date(),
        storeName: store.storeName,
        storeUrl: store.storeUrl,
        subdomain: store.subdomain,
        platform: "Shopify",
        isShopifyConnected: true,
        shopifyConnectedAt: new Date(),
        shopifyUserEmail: email,
        userSettings: {
          create: {
            allowSupport: true,
            ipAddressOption: "anonymized",
            enableGeo: true,
            enablePreferences: false,
            emailStoreOption: "full-email",
            locationStoreOption: "yes",
            nameStoreOption: "yes",
            attributionModel: "impression",
            notificationPreferences: {
              email: true,
              push: true,
              sms: false,
            },
          },
        },
        optInSettings: {
          create: {
            customPromptEnabled: true,
            customPromptHeadline: "حصص خصوصی حاصل کریں!",
            customPromptDescription: "سیلز اور خصوصی پیشکشوں کے بارے میں سب سے پہلے جانیں",
            customPromptButtonText: "جی ہاں، مطلع کریں",
            customPromptCancelText: "شاید بعد میں",
            customPromptPrimaryColor: "#0066cc",
            customPromptPosition: "center",
            flyoutEnabled: true,
            flyoutPosition: "bottom-right",
            flyoutText: "اپڈیٹس حاصل کریں",
            flyoutColor: "#0066cc",
            flyoutDelaySeconds: 5,
            exitIntentEnabled: true,
            exitIntentHeadline: "رکیں! مت چھوڑیں!",
            exitIntentOffer: "اپنے پہلے آرڈر پر 10% رعایت حاصل کریں",
            timingTriggerType: "delay",
            timingDelaySeconds: 5,
            showOncePerSession: true,
          },
        },
      },
    });

    merchants.push(merchant);
    console.log(`✅ Created merchant: ${merchant.storeName}`);
  }

  // Create Custom Attributes
  console.log("🏷️ Creating custom attributes...");
  const customAttributes = [];

  for (const merchant of merchants) {
    const attributes = [
      {
        name: "Favorite Category",
        type: "CATEGORY" as const,
        description: "Customer's favorite product category",
        options: ["Electronics", "Fashion", "Home & Living", "Sports", "Books"],
        required: false,
        isActive: true,
      },
      {
        name: "Budget Range",
        type: "CATEGORY" as const,
        description: "Customer's budget range in PKR",
        options: ["Under 5000", "5000-10000", "10000-25000", "25000-50000", "Above 50000"],
        required: false,
        isActive: true,
      },
      {
        name: "Preferred Language",
        type: "MULTIPLE_CHOICE" as const,
        description: "Customer's preferred language",
        options: ["Urdu", "English", "Punjabi", "Sindhi", "Pashto"],
        required: false,
        isActive: true,
      },
    ];

    for (const attr of attributes) {
      const customAttr = await prisma.customAttribute.create({
        data: {
          merchantId: merchant.id,
          ...attr,
        },
      });
      customAttributes.push(customAttr);
    }
  }

  // Create Segments
  console.log("📊 Creating segments...");
  const segments = [];

  for (const merchant of merchants) {
    const segmentData = [
      {
        name: "Karachi Customers",
        description: "Customers from Karachi",
        type: "DYNAMIC" as const,
        isActive: true,
        criteriaDisplay: "Location: Karachi",
        conditions: {
          create: [
            {
              type: "location",
              category: "city",
              operator: "equals",
              value: "Karachi",
              orderIndex: 0,
            },
          ],
        },
      },
      {
        name: "Lahore Customers",
        description: "Customers from Lahore",
        type: "DYNAMIC" as const,
        isActive: true,
        criteriaDisplay: "Location: Lahore",
        conditions: {
          create: [
            {
              type: "location",
              category: "city",
              operator: "equals",
              value: "Lahore",
              orderIndex: 0,
            },
          ],
        },
      },
      {
        name: "Mobile Users",
        description: "Customers using mobile devices",
        type: "DYNAMIC" as const,
        isActive: true,
        criteriaDisplay: "Device: Mobile",
        conditions: {
          create: [
            {
              type: "device",
              category: "isMobile",
              operator: "equals",
              value: "true",
              orderIndex: 0,
            },
          ],
        },
      },
      {
        name: "High Value Customers",
        description: "Customers with high engagement",
        type: "BEHAVIOR" as const,
        isActive: true,
        criteriaDisplay: "Engagement: High",
        conditions: {
          create: [
            {
              type: "behavior",
              category: "engagement",
              operator: "greater_than",
              numberValue: 5,
              orderIndex: 0,
            },
          ],
        },
      },
    ];

    for (const seg of segmentData) {
      const segment = await prisma.segment.create({
        data: {
          merchantId: merchant.id,
          ...seg,
        },
      });
      segments.push(segment);
    }
  }

  // Create Subscribers with Pakistani data
  console.log("👥 Creating subscribers...");
  const subscribers = [];

  for (let i = 0; i < merchants.length; i++) {
    const merchant = merchants[i];
    const numSubscribers = 20 + Math.floor(Math.random() * 30); // 20-50 subscribers per merchant

    for (let j = 0; j < numSubscribers; j++) {
      const cityData = PAKISTANI_CITIES[Math.floor(Math.random() * PAKISTANI_CITIES.length)];
      const name = PAKISTANI_NAMES[Math.floor(Math.random() * PAKISTANI_NAMES.length)];
      const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${j}@gmail.com`;
      const isMobile = Math.random() > 0.3; // 70% mobile users
      const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
      const os = isMobile
        ? ["Android", "iOS"][Math.floor(Math.random() * 2)]
        : ["Windows", "macOS", "Linux"][Math.floor(Math.random() * 3)];

      const subscriber = await prisma.subscriber.create({
        data: {
          merchantId: merchant.id,
          fcmToken: `fcm_token_${merchant.id}_${j}_${Date.now()}`,
          fingerprint: `fingerprint_${merchant.id}_${j}_${Date.now()}`,
          email: email,
          firstName: name.firstName,
          lastName: name.lastName,
          country: cityData.country,
          countryCode: cityData.countryCode,
          city: cityData.city,
          region: cityData.region,
          timezone: cityData.timezone,
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          browserVersion: `${Math.floor(Math.random() * 5) + 10}.${Math.floor(Math.random() * 10)}`,
          os: os,
          osVersion: isMobile
            ? `${Math.floor(Math.random() * 5) + 10}.${Math.floor(Math.random() * 10)}`
            : `${Math.floor(Math.random() * 5) + 10}.${Math.floor(Math.random() * 10)}`,
          device: isMobile ? "Mobile" : "Desktop",
          isMobile: isMobile,
          language: "ur", // Urdu
          userAgent: `Mozilla/5.0 (${os}) AppleWebKit/537.36`,
          subscriptionUrl: merchant.storeUrl,
          isActive: Math.random() > 0.1, // 90% active
          subscribedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
          lastSeenAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
          attributes: {
            favoriteCategory: ["Electronics", "Fashion", "Home & Living"][Math.floor(Math.random() * 3)],
            budgetRange: ["Under 5000", "5000-10000", "10000-25000"][Math.floor(Math.random() * 3)],
            preferredLanguage: ["Urdu", "English"][Math.floor(Math.random() * 2)],
          },
        },
      });

      subscribers.push(subscriber);
    }

    console.log(`✅ Created ${numSubscribers} subscribers for ${merchant.storeName}`);
  }

  // Create Campaigns
  console.log("📢 Creating campaigns...");
  const campaigns = [];

  const campaignTitles = [
    "Ramadan Sale - Up to 50% Off",
    "Eid Collection - New Arrivals",
    "Summer Fashion Sale",
    "Electronics Mega Sale",
    "Home & Living Discount",
    "Sports Equipment Sale",
    "Back to School Special",
    "Winter Collection Launch",
  ];

  const campaignMessages = [
    "🎉 رمضان کی بڑی سیل! تمام مصنوعات پر 50% تک رعایت",
    "🎁 عید کی خاص پیشکش! نئی مصنوعات دیکھیں",
    "☀️ گرمیوں کی فیشن سیل - تازہ ترین ڈیزائنز",
    "📱 الیکٹرانکس میگا سیل - بہترین قیمتیں",
    "🏠 گھر اور رہائش کی مصنوعات پر رعایت",
    "⚽ کھیلوں کے سامان پر خصوصی پیشکش",
    "📚 اسکول واپسی کی خاص پیشکش",
    "❄️ سردیوں کا نیا کولیکشن - ابھی خریدیں",
  ];

  for (const merchant of merchants) {
    const numCampaigns = 3 + Math.floor(Math.random() * 5); // 3-8 campaigns per merchant

    for (let i = 0; i < numCampaigns; i++) {
      const titleIndex = Math.floor(Math.random() * campaignTitles.length);
      const statuses: Array<"DRAFT" | "SCHEDULED" | "SENT" | "PAUSED"> = ["DRAFT", "SCHEDULED", "SENT", "PAUSED"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type: "REGULAR" | "FLASH_SALE" = Math.random() > 0.7 ? "FLASH_SALE" : "REGULAR";
      const sentAt = status === "SENT" ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null;

      const merchantSegments = segments.filter((s) => s.merchantId === merchant.id);
      const selectedSegments = merchantSegments.slice(0, Math.min(2, merchantSegments.length));

      const campaign = await prisma.campaign.create({
        data: {
          merchantId: merchant.id,
          title: campaignTitles[titleIndex],
          description: `Special campaign for ${merchant.storeName} customers`,
          category: ["Fashion", "Electronics", "Home", "Sports", "Books"][Math.floor(Math.random() * 5)],
          type: type,
          status: status,
          sendingOption: status === "SENT" ? "now" : "schedule",
          scheduledAt: status === "SCHEDULED" ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          sentAt: sentAt,
          smartDelivery: Math.random() > 0.5,
          message: campaignMessages[titleIndex],
          destinationUrl: `${merchant.storeUrl}/products`,
          actionButtonText: "ابھی خریدیں",
          enableSound: true,
          enableVibration: true,
          ttl: "86400",
          impressions: status === "SENT" ? Math.floor(Math.random() * 1000) + 100 : 0,
          clicks: status === "SENT" ? Math.floor(Math.random() * 100) + 10 : 0,
          ctr: status === "SENT" ? Math.random() * 0.15 + 0.02 : 0,
          revenue: status === "SENT" ? Math.random() * 50000 + 5000 : 0,
          heroImages: {
            create: [
              {
                platform: "windows",
                imageUrl: "https://ucarecdn.com/sample-windows-image/",
              },
              {
                platform: "mac",
                imageUrl: "https://ucarecdn.com/sample-mac-image/",
              },
              {
                platform: "ios",
                imageUrl: "https://ucarecdn.com/sample-ios-image/",
              },
              {
                platform: "android",
                imageUrl: "https://ucarecdn.com/sample-android-image/",
              },
            ],
          },
          companyLogos: {
            create: [
              {
                logoUrl: "https://ucarecdn.com/sample-logo/",
                isActive: true,
              },
            ],
          },
          segments: {
            create: selectedSegments.map((segment) => ({
              segmentId: segment.id,
            })),
          },
        },
      });

      campaigns.push(campaign);

      // Create campaign analytics for sent campaigns
      if (status === "SENT" && sentAt) {
        const numDays = Math.floor(Math.random() * 7) + 1;
        for (let day = 0; day < numDays; day++) {
          const date = new Date(sentAt);
          date.setDate(date.getDate() + day);

          await prisma.campaignAnalytics.create({
            data: {
              campaignId: campaign.id,
              date: date,
              impressions: Math.floor(Math.random() * 200) + 50,
              clicks: Math.floor(Math.random() * 30) + 5,
              conversions: Math.floor(Math.random() * 10) + 1,
              revenue: Math.random() * 10000 + 1000,
              subscribersTargeted: selectedSegments.reduce(
                (sum, seg) => sum + seg.subscriberCount,
                0
              ),
              subscribersReached: Math.floor(Math.random() * 500) + 100,
              deviceBreakdown: {
                mobile: Math.floor(Math.random() * 60) + 30,
                desktop: Math.floor(Math.random() * 40) + 20,
                tablet: Math.floor(Math.random() * 10) + 5,
              },
              platformBreakdown: {
                android: Math.floor(Math.random() * 40) + 20,
                ios: Math.floor(Math.random() * 30) + 15,
                windows: Math.floor(Math.random() * 20) + 10,
                mac: Math.floor(Math.random() * 10) + 5,
              },
              locationBreakdown: {
                karachi: Math.floor(Math.random() * 30) + 10,
                lahore: Math.floor(Math.random() * 25) + 10,
                islamabad: Math.floor(Math.random() * 15) + 5,
                other: Math.floor(Math.random() * 30) + 10,
              },
            },
          });
        }
      }

      // Create campaign sends for some subscribers
      if (status === "SENT") {
        const merchantSubscribers = subscribers.filter((s) => s.merchantId === merchant.id);
        const numSends = Math.min(50, merchantSubscribers.length);

        for (let k = 0; k < numSends; k++) {
          const subscriber = merchantSubscribers[Math.floor(Math.random() * merchantSubscribers.length)];
          const sentAt = new Date(campaign.sentAt || new Date());
          sentAt.setHours(sentAt.getHours() + Math.floor(Math.random() * 24));

          await prisma.campaignSend.create({
            data: {
              campaignId: campaign.id,
              subscriberId: subscriber.id,
              sentAt: sentAt,
              deliveredAt: Math.random() > 0.1 ? new Date(sentAt.getTime() + Math.random() * 60000) : null,
              clickedAt: Math.random() > 0.7 ? new Date(sentAt.getTime() + Math.random() * 3600000) : null,
            },
          });
        }
      }
    }

    console.log(`✅ Created ${numCampaigns} campaigns for ${merchant.storeName}`);
  }

  // Create Opt-In Analytics
  console.log("📈 Creating opt-in analytics...");
  for (const merchant of merchants) {
    const optInSettings = await prisma.optInSettings.findUnique({
      where: { merchantId: merchant.id },
    });

    if (optInSettings) {
      const numDays = 30;
      for (let day = 0; day < numDays; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        await prisma.optInAnalytics.create({
          data: {
            optInSettingsId: optInSettings.id,
            date: date,
            customPromptViews: Math.floor(Math.random() * 100) + 20,
            customPromptAccepts: Math.floor(Math.random() * 30) + 5,
            customPromptRate: Math.random() * 0.4 + 0.1,
            browserPromptViews: Math.floor(Math.random() * 150) + 30,
            browserPromptAccepts: Math.floor(Math.random() * 50) + 10,
            browserPromptRate: Math.random() * 0.5 + 0.2,
            flyoutViews: Math.floor(Math.random() * 200) + 50,
            flyoutSubscriptions: Math.floor(Math.random() * 40) + 10,
            flyoutRate: Math.random() * 0.3 + 0.1,
            exitIntentViews: Math.floor(Math.random() * 80) + 15,
            exitIntentSubscriptions: Math.floor(Math.random() * 20) + 5,
            exitIntentRate: Math.random() * 0.35 + 0.15,
            totalImpressions: Math.floor(Math.random() * 500) + 100,
            totalSubscriptions: Math.floor(Math.random() * 100) + 20,
            overallOptInRate: Math.random() * 0.3 + 0.15,
            averageTimeToOptIn: Math.floor(Math.random() * 30) + 5,
            averageScrollToOptIn: Math.floor(Math.random() * 50) + 20,
            deviceBreakdown: {
              mobile: Math.floor(Math.random() * 60) + 30,
              desktop: Math.floor(Math.random() * 40) + 20,
            },
          },
        });
      }
    }
  }

  // Update segment subscriber counts
  console.log("🔄 Updating segment subscriber counts...");
  for (const segment of segments) {
    const merchantSubscribers = subscribers.filter((s) => s.merchantId === segment.merchantId);
    let count = 0;

    if (segment.name.includes("Karachi")) {
      count = merchantSubscribers.filter((s) => s.city === "Karachi").length;
    } else if (segment.name.includes("Lahore")) {
      count = merchantSubscribers.filter((s) => s.city === "Lahore").length;
    } else if (segment.name.includes("Mobile")) {
      count = merchantSubscribers.filter((s) => s.isMobile).length;
    } else {
      count = Math.floor(merchantSubscribers.length * 0.3);
    }

    await prisma.segment.update({
      where: { id: segment.id },
      data: {
        subscriberCount: count,
        lastCalculated: new Date(),
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - Merchants: ${merchants.length}`);
  console.log(`   - Subscribers: ${subscribers.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Segments: ${segments.length}`);
  console.log(`   - Custom Attributes: ${customAttributes.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

