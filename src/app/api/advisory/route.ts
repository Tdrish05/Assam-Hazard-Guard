import { NextResponse } from 'next/server';

/**
 * POST: Generate localized emergency advisories using Google Gemini 1.5 Flash.
 * If GEMINI_API_KEY is not configured in .env, falls back to a rules-based generator.
 */
export async function POST(request: Request) {
  try {
    const { 
      type, 
      severity, 
      description, 
      locationName, 
      latitude, 
      longitude, 
      nearestShelter,
      language 
    } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const isAssamese = language === 'as';

    // 1. Live Google Gemini API Integration
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      const prompt = `You are the Assam Emergency Safety AI Advisor.
Given the following active hazard incident details in Assam:
- Location Name: ${locationName} (Coordinates: ${latitude}°, ${longitude}°)
- Hazard Type: ${type}
- Severity: ${severity}
- Details: ${description}
- Nearest Shelter: ${nearestShelter.name} (${nearestShelter.distance}km away, Bed status: ${nearestShelter.occupied}/${nearestShelter.capacity} occupied, Food Reserve: ${nearestShelter.supplies.food}, Medical Kit: ${nearestShelter.supplies.medicine})

Generate a localized disaster advisory in ${isAssamese ? 'Assamese (অসমীয়া)' : 'English'}.
Structure the response with these headers:
1. ⚠️ Threat Level & Local Risk Analysis
2. 🧭 Immediate Evacuation Guidelines (specifically mentioning the nearest shelter name and what citizens should carry based on its supply levels)
3. 🚨 Coordinator Logistics (actionable guidelines for camp coordinators regarding resource distributions)

Keep it concise, highly actionable, and formatted in clear Markdown bullet points. Do not include introductory conversational filler.`;

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            }),
            next: { revalidate: 60 } // cache same incidents for 60 seconds
          }
        );

        if (geminiResponse.ok) {
          const resData = await geminiResponse.json();
          const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return NextResponse.json({ success: true, text: rawText });
          }
        } else {
          console.warn('Gemini API returned an error, falling back to local advisory rules.');
        }
      } catch (geminiError) {
        console.error('Gemini connection error:', geminiError);
      }
    }

    // 2. High-Fidelity Local Rule-Based Fallback Generator (Works out-of-the-box!)
    const foodAlert = nearestShelter.supplies.food === 'critical' || nearestShelter.supplies.food === 'low';
    const medAlert = nearestShelter.supplies.medicine === 'critical' || nearestShelter.supplies.medicine === 'low';

    let advisoryText = '';

    if (isAssamese) {
      // Localized Assamese template
      advisoryText = `### ⚠️ বিপদাশংকা বিশ্লেষণ
*   **বিভাগ:** ${type.toUpperCase()} | **তীব্ৰতা:** ${severity === 'red' ? 'জৰুৰী (Red)' : 'সতৰ্কবাণী (Orange)'}
*   **স্থান:** ${locationName} (${latitude.toFixed(3)}° উ, ${longitude.toFixed(3)}° পূ)
*   **পৰিস্থিতি:** বৰ্তমানৰ বতৰৰ অগ্ৰগতি অনুসৰি এই অঞ্চলত জীৱন আৰু সম্পত্তিৰ প্ৰতি আশু বিপদ আছে। মাটিৰ আৰ্দ্ৰতা আৰু জলস্তৰ নিয়ন্ত্ৰণৰ বাহিৰত গৈছে।

### 🧭 স্থানান্তৰণ পথনিৰ্দেশ
*   **আশ্ৰয় কেন্দ্ৰ:** আটাইতকৈ ওচৰৰ আশ্ৰয় শিবিৰ হৈছে **${nearestShelter.name}** (দূৰত্ব: **${nearestShelter.distance} কি.মি.**)।
*   **কি আনিব:** অনুগ্ৰহ কৰি জৰুৰীকালীন নথিপত্ৰ, টৰ্চ লাইট, শুকান খাদ্য আৰু প্ৰাথমিক ঔষধ লগত ৰাখক।
*   ${foodAlert ? '⚠️ **সতৰ্কবাণী:** এই আশ্ৰয় শিবিৰত খাদ্য সংকটে দেখা দিছে। সম্ভৱ হ’লে লগত পৰ্যাপ্ত পৰিমাণৰ শুকান খাদ্য লৈ যাওক।' : '✓ আশ্ৰয় শিবিৰত বৰ্তমান পৰ্যাপ্ত খাদ্য মজুত আছে।'}
*   ${medAlert ? '⚠️ **সতৰ্কবাণী:** শিবিৰত ঔষধৰ নাটনি হৈছে। নিজৰ নিয়মীয়া ঔষধ লগত আনিবলৈ নাপাহৰিব।' : '✓ শিবিৰত প্ৰাথমিক চিকিৎসা কিট আৰু জৰুৰীকালীন ঔষধ উপলব্ধ আছে।'}

### 🚨 সমন্বয়ক পদক্ষেপ (Logistics)
*   ${nearestShelter.name} ৰ শিবিৰ পৰিচালকে জিলা নিয়ন্ত্ৰণ কক্ষৰ সৈতে যোগাযোগ কৰক।
*   ${foodAlert ? '🍚 **জিলা সমন্বয়কৰ নিৰ্দেশ:** খাদ্য সৰবৰাহ খৰতকীয়া কৰিবলৈ ছিলচৰ সাহায্য ভঁৰালৰ সৈতে যোগাযোগ কৰা হৈছে।' : '🍚 খাদ্য সৰবৰাহ স্বাভাৱিক ৰাখিবলৈ নিয়মীয়া তদাৰক কৰক।'}
*   ${medAlert ? '💊 **জিলা সমন্বয়কৰ নিৰ্দেশ:** চিকিৎসা দল আৰু অতিৰিক্ত মেডিকেল কিট অনতিবিলম্বে শিবিৰলৈ প্ৰেৰণ কৰাৰ ব্যৱস্থা কৰা হৈছে।' : '💊 জৰুৰীকালীন চিকিৎসা সেৱা সক্ৰিয় কৰি ৰাখক।'}`;
    } else {
      // Localized English template
      advisoryText = `### ⚠️ Threat Analysis
*   **Category:** ${type.toUpperCase()} | **Severity:** ${severity.toUpperCase()}
*   **Target Sector:** ${locationName} (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)
*   **Status:** Saturation metrics indicate high regional instability. Structural runoff and flash floods are highly probable in low sectors.

### 🧭 Immediate Evacuation Guidelines
*   **Primary Destination:** Evacuate to **${nearestShelter.name}** (Distance: **${nearestShelter.distance} km**).
*   **Pre-Packing list:** Pack ID proofs, drinking water, dry food rations, and family medical supplies.
*   ${foodAlert ? '⚠️ **Notice:** Food reserves at this camp are currently LOW. Citizens are requested to carry their own dry food packets.' : '✓ Food reserves at the destination camp are currently ADEQUATE.'}
*   ${medAlert ? '⚠️ **Notice:** Medical supplies at this camp are currently LOW. Do not forget to carry your personal prescriptions.' : '✓ Medical first-response kits are available at the destination camp.'}

### 🚨 Coordinator Logistics
*   Camp Managers at ${nearestShelter.name} must coordinate immediate safety reports.
*   ${foodAlert ? '🍚 **Logistics Alert:** Contacting central food distribution centers to dispatch emergency ration trucks.' : '🍚 Maintain standard daily ration registries.'}
*   ${medAlert ? '💊 **Logistics Alert:** Rerouting the local medical response team to dispatch extra emergency medicine kits.' : '💊 Keep the first-aid unit active 24/7.'}`;
    }

    return NextResponse.json({ success: true, text: advisoryText, fallback: true });
  } catch (error: any) {
    console.error('Advisory API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error generating advisories.' },
      { status: 500 }
    );
  }
}
