import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "http://localhost:3000"; // Replace with production URL

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/dashboard/pm`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/dashboard/dev`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.7,
        },
    ];
}
