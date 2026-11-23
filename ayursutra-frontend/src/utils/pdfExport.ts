export interface PrintPrescriptionData {
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientPhone?: string;
  primaryDosha?: string;
  doctorName?: string;
  date?: string;
  diagnosis?: string;
  therapyPlanName?: string;
  therapies: {
    name: string;
    duration?: string;
    frequency?: string;
    notes?: string;
  }[];
  dietInstructions?: string[];
  lifestylePrecautions?: string[];
}

export function printAyurvedicPrescription(data: PrintPrescriptionData) {
  const currentDate = data.date || new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const printWindow = window.open("", "_blank", "width=850,height=950");
  if (!printWindow) {
    alert("Please allow popups to generate and print your Ayurvedic prescription PDF.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AyurSutra Prescription - ${data.patientName}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1a3328;
            margin: 0;
            padding: 24px;
            line-height: 1.5;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #23533e;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-title h1 {
            margin: 0;
            font-size: 26px;
            color: #173d2d;
            letter-spacing: -0.5px;
          }
          .logo-title p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #557262;
          }
          .clinic-info {
            text-align: right;
            font-size: 11px;
            color: #63776a;
            line-height: 1.4;
          }
          .patient-bar {
            background-color: #f4f7f3;
            border: 1px solid #d5ded2;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            font-size: 12px;
          }
          .patient-bar strong {
            color: #173d2d;
          }
          .dosha-tag {
            display: inline-block;
            background: #e5eee3;
            color: #245c3b;
            padding: 2px 8px;
            border-radius: 9999px;
            font-weight: 600;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            color: #1e4a36;
            border-bottom: 1px solid #e1e8de;
            padding-bottom: 6px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 16px;
          }
          th {
            background-color: #edf3eb;
            color: #1b4530;
            text-align: left;
            padding: 9px 12px;
            border: 1px solid #d8e2d4;
            font-weight: 600;
          }
          td {
            padding: 9px 12px;
            border: 1px solid #e4ebe0;
            color: #294034;
          }
          .grid-two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .bullet-box {
            background: #fafcf9;
            border: 1px solid #e7eee4;
            border-radius: 10px;
            padding: 12px 16px;
          }
          .bullet-box ul {
            margin: 0;
            padding-left: 18px;
            font-size: 11.5px;
            color: #3b5446;
          }
          .bullet-box li {
            margin-bottom: 6px;
          }
          .footer {
            margin-top: 48px;
            padding-top: 20px;
            border-top: 1px dashed #c8d6c4;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 11px;
            color: #6d8074;
          }
          .signature-box {
            text-align: right;
          }
          .signature-line {
            width: 180px;
            border-bottom: 1px solid #1b4530;
            margin-bottom: 6px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-title">
            <h1>AyurSutra Wellness & Hospital</h1>
            <p>Centre of Excellence in Classical Panchakarma & Integrative Ayurveda</p>
          </div>
          <div class="clinic-info">
            <div>NABH Accredited & AYUSH Certified</div>
            <div>Registry No: AYUR-IND-2026/894</div>
            <div>Helpline: +91 (800) 298-7887</div>
          </div>
        </div>

        <div class="patient-bar">
          <div><strong>Patient Name:</strong> ${data.patientName}</div>
          <div><strong>Age / Gender:</strong> ${data.patientAge || "—"} / ${data.patientGender || "—"}</div>
          <div><strong>Contact:</strong> ${data.patientPhone || "—"}</div>
          <div><strong>Date:</strong> ${currentDate}</div>
          <div><strong>Consulting Doctor:</strong> ${data.doctorName || "AyurSutra Medical Team"}</div>
          <div><strong>Prakriti / Dosha:</strong> <span class="dosha-tag">${data.primaryDosha || "Vata-Pitta"}</span></div>
        </div>

        ${
          data.diagnosis
            ? `
          <div class="section">
            <div class="section-title">Clinical Assessment & Diagnosis</div>
            <p style="font-size: 12px; margin: 0; color: #2e473a;">${data.diagnosis}</p>
          </div>
        `
            : ""
        }

        <div class="section">
          <div class="section-title">Prescribed Panchakarma Protocol (${data.therapyPlanName || "Treatment Plan"})</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35%;">Therapy Procedure</th>
                <th style="width: 20%;">Duration</th>
                <th style="width: 20%;">Schedule / Frequency</th>
                <th style="width: 25%;">Clinical Notes & Oils</th>
              </tr>
            </thead>
            <tbody>
              ${data.therapies
                .map(
                  (t) => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td>${t.duration || "45 - 60 Mins"}</td>
                  <td>${t.frequency || "Daily Course"}</td>
                  <td>${t.notes || "Warm medicated oil application with gentle continuous strokes."}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="grid-two">
          <div class="section">
            <div class="section-title">Dietary Guidelines (Pathya Ahara)</div>
            <div class="bullet-box">
              <ul>
                ${(data.dietInstructions || [
                  "Warm freshly cooked unctuous meals (Kichadi, Mung soup, Steamed greens).",
                  "Sip warm water boiled with dry ginger and cumin throughout the day.",
                  "Strictly avoid ice-cold drinks, oily deep-fried foods, and heavy dairy.",
                  "Eat meals at calm regular hours without screen distractions."
                ])
                  .map((item) => `<li>${item}</li>`)
                  .join("")}
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Lifestyle Precautions (Vihara)</div>
            <div class="bullet-box">
              <ul>
                ${(data.lifestylePrecautions || [
                  "Protect body from direct cold wind, air conditioners, and rain drafts.",
                  "Take bath only in lukewarm water after therapies have rested for 1-2 hours.",
                  "Avoid daytime naps (Divasvapna) to prevent Kapha & Ama accumulation.",
                  "Retire to bed before 10:00 PM for restorative nervous tissue recovery."
                ])
                  .map((item) => `<li>${item}</li>`)
                  .join("")}
              </ul>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>
            <div>This prescription is generated electronically via AyurSutra Health Information System.</div>
            <div>For therapy questions or scheduling adjustments, please call the clinic desk.</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>${data.doctorName || "Dr. Authorized Vaidya"}</strong></div>
            <div>BAMS, MD (Ayurveda) - Chief Physician</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
