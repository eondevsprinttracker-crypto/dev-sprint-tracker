import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/admin/"],
        },
        sitemap: "http://localhost:3000/sitemap.xml", // Replace with production URL
    };
}
