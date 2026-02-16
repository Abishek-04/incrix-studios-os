
import { Platform } from '@/types';

const fetchMockSocialMetrics = (url, platform) => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash) + url.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    let viewMultiplier = 1;
    if (platform === Platform.YouTube) viewMultiplier = 1.5;
    if (platform === Platform.TikTok) viewMultiplier = 2.5;

    const views = Math.floor(((seed % 10000) + 500) * viewMultiplier);
    const likeRate = 0.08 + (seed % 5) / 100;
    const likes = Math.floor(views * likeRate);
    const commentRate = 0.005 + (seed % 3) / 1000;
    const comments = Math.floor(views * commentRate);
    const retentionVal = 35 + (seed % 45);

    return {
        views,
        likes,
        comments,
        retention: `${retentionVal}%`
    };
};

export const fetchSocialMetrics = async (url, platform) => {
    // Return mock metrics directly as Gemini service is removed
    return Promise.resolve(fetchMockSocialMetrics(url, platform));
};
