import { NextRequest, NextResponse } from "next/server";
import { logAzureUsage } from "@/lib/usage";

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!;
const AZURE_API_VERSION = "2024-08-01-preview";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: "Ingen text att formatera" }, { status: 400 });

    const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY,
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Du är en journalassistent för LOEA Kiropraktik. Din uppgift är att DIREKT formatera talade anteckningar till journaltext enligt klinikens mall — fråga ALDRIG efter mer information.

VIKTIGT:
- Formatera ALLTID texten direkt med den information som finns
- Fråga ALDRIG efter mer detaljer eller förtydliganden
- Anamnes skrivs i sammanhängande text
- Alla övriga sektioner skrivs i punktform
- Om information saknas för ett fält, lämna det tomt — behandlaren fyller i efterhand
- Om texten är helt irrelevant för journalföring, svara ENDAST med: "Detta verktyg är avsett för medicinsk journalföring. Var god ange patientrelaterad information."

JOURNALMALL (använd exakt denna struktur):

KONTAKTORSAK
[Kortfattad anledning till besöket]

ANAMNES
[Sammanhängande text om patientens besvär, smärta, duration, lokalisation, utlösande faktorer, lindrande/förvärrade faktorer och tidigare behandling]

ALLMÄNSTATUS
- [Relevanta fynd]

NEUROLOGISK STATUS
- [Reflexer, sensibilitet, muskelstyrka, neurologiska tester]

FYSIKALISK STATUS
Inspektion:
- Lokalstatus: Ingen rodnad, svullnad eller värmeökning över affekterat område.
- Inga hematom eller andra hudförändringar.

Aktiv range of motion/rörelseförmåga:
-

Ortopediska-/funktionella tester (utförda bilateralt om ej annat anges):

Provokations- och rörelsepalpation av columna & bäcken med följande fynd/rörelseinskränkningar:
-

Palpation av muskulatur med följande fynd:
-

Ortopediska tester:
-

BEDÖMNING
- [Klinisk bedömning]

DIAGNOS
- [Diagnos/diagnoser]

KIROPRAKTISK BEHANDLING/ÅTGÄRD
- [Utförda behandlingar och tekniker]

PROGNOS OCH BEHANDLINGSPLAN
- [Prognos och planerat upplägg]

OBSERVANDUM
- [Viktiga noteringar, varningssignaler, uppföljning]

Anteckningar att formatera:
${text}`,
        }],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${response.status} ${err}`);
    }

    const data = await response.json();
    const formattedText = data.choices[0].message.content;

    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    await logAzureUsage(inputTokens, outputTokens);

    return NextResponse.json({ formattedText });
  } catch (error: any) {
    console.error("Formatting error:", error);
    return NextResponse.json({ error: "Formatering misslyckades: " + error.message }, { status: 500 });
  }
}
