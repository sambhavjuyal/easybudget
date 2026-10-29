import { GoogleGenAI } from '@google/genai';

// Change this if Google retires the model.
export const GEMINI_MODEL = 'gemini-3.8-flash';

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isHttps = (u) => typeof u === 'string' && /^https:\/\//i.test(u);

/** Searches job portals through Gemini + Google Search using the user's own key. Never returns invented jobs. */
export async function searchJobs(req, apiKey) {
  const searchTerm = clean(req?.query, 120) || clean(req?.category, 120) || 'remote part-time software developer or content specialist';
  const loc = clean(req?.location, 120) || 'Bengaluru / India / Remote';
  const deficit = Number.isFinite(req?.targetDeficit) ? req.targetDeficit : 15000;
    const prompt = `Use Google Search to find current, real job postings and side gigs from specific job portals (such as LinkedIn, Naukri, Indeed India, RemoteOK, Wellfound, WeWorkRemotely, or Internshala) that help bridge a cost-of-living deficit of ₹${deficit}/month in India.
Target role/keywords: "${searchTerm}"
Target location/work style: "${loc}".

Search specifically on job boards for active hiring listings.
Provide a clean structured JSON list of 4 to 6 job opportunities.
For each opportunity, include:
- id (string or random slug)
- title (exact position title)
- company (employer company name)
- portalName (e.g., "LinkedIn", "Naukri", "Indeed", "RemoteOK", "Wellfound", "WeWorkRemotely")
- portalUrl (the actual web URL or job portal search URL found via Google)
- payRate (e.g. "₹30,000 - ₹50,000 / mo" or "₹800 - ₹1,500 / hr" or "₹6L - ₹12L / yr")
- estimatedMonthlyBoost (number in INR, estimating monthly earnings for this position or part-time hours, e.g. 18000)
- workType ("Remote", "Hybrid", or "On-Site")
- commitment ("Part-time", "Contract", "Full-time", or "Flexible Gig")
- description (1-2 sentences on what the role entails and why it suits beating inflation in India)
- keySkills (array of 3-4 strings)

Format your response as valid JSON matching this schema:
{
  "jobs": [
    {
      "id": "job-1",
      "title": "Title",
      "company": "Company",
      "portalName": "Portal",
      "portalUrl": "https://...",
      "payRate": "₹30,000/mo",
      "estimatedMonthlyBoost": 30000,
      "workType": "Remote",
      "commitment": "Part-time",
      "description": "...",
      "keySkills": ["Skill 1", "Skill 2"]
    }
  ],
  "summary": "Brief summary of market trends for these roles in India"
}
Output only the JSON.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    let text = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const a = text.indexOf('{');
    const b = text.lastIndexOf('}');
    if (a !== -1 && b > a) text = text.slice(a, b + 1);

    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* handled below */ }
    if (!parsed || !Array.isArray(parsed.jobs) || parsed.jobs.length === 0) {
      return { ok: false, error: "Gemini's answer couldn't be read this time. Please try again." };
    }

    // Only https links are ever shown; anything else becomes a safe Google search for that job.
    const jobs = parsed.jobs.slice(0, 8).map((j) => ({
      ...j,
      portalUrl: isHttps(j.portalUrl)
        ? j.portalUrl
        : 'https://www.google.com/search?q=' + encodeURIComponent(`${j.title ?? ''} ${j.company ?? ''}`.trim()),
    }));
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
      .filter((c) => c.web?.uri && c.web?.title && isHttps(c.web.uri))
      .map((c) => ({ title: c.web.title, uri: c.web.uri }));

    return { ok: true, data: { jobs, summary: typeof parsed.summary === 'string' ? parsed.summary : '' }, sources };
  } catch (err) {
    return { ok: false, error: explain(err) };
  }
}

function explain(err) {
  const status = err?.status ?? err?.code;
  const msg = String(err?.message ?? '');
  if (status === 401 || status === 403 || /API key|API_KEY|permission/i.test(msg)) return 'Gemini rejected your API key. Check it in Settings.';
  if (status === 429) return 'Gemini rate limit reached. Please wait a minute and try again.';
  if (status === 404) return "Google's Gemini model isn't available any more. This app needs an update.";
  if (/fetch failed|ENOTFOUND|ECONN|network|offline/i.test(msg)) return 'Could not reach Google. Check your internet connection.';
  return 'The job search failed. Please try again in a moment.';
}
