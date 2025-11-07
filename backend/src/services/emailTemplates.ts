export type EmailTemplateParams = {
  leadName: string;
  address?: string;
  estimatedSavings?: number;
  bookingLink?: string;
};

export const EmailSubjects = {
  welcome: (leadName: string) => `Welcome ${leadName}! See your solar savings in minutes`,
  edu: () => `How solar saves you money (and what to expect)`,
  caseStudy: () => `Real customer results: $1,840/year saved with solar`,
  finalCTA: () => `Last chance: lock in your solar incentives this month`,
  appointmentConfirm: (date: string, time: string) => `Your solar consultation is confirmed: ${date} @ ${time}`,
};

export const EmailTemplates = {
  welcomeHTML: ({ leadName, address, estimatedSavings }: EmailTemplateParams) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
    <h1 style="margin:0 0 12px">Welcome, ${leadName}! 🌞</h1>
    <p>Thanks for your interest in going solar. Based on your info${address ? ` at <strong>${address}</strong>` : ""}, you could save up to <strong>$${estimatedSavings ?? 1200}/year</strong>.</p>
    <p>Next step: Get your exact numbers in a quick 15-minute consultation with our advisor.</p>
    <p>
      <a href="{{BOOKING_LINK}}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Book Free Consultation</a>
    </p>
    <p style="color:#555">No pressure. We'll just show your options and you decide.</p>
  </div>
  `,

  eduHTML: ({ leadName }: EmailTemplateParams) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
    <h2>How solar saves you money, ${leadName}</h2>
    <ol>
      <li><strong>Replace</strong> expensive grid power with your own clean energy</li>
      <li><strong>Stabilize</strong> your bill against utility rate hikes</li>
      <li><strong>Incentives</strong> can cover up to 30% or more of system cost</li>
    </ol>
    <p>Want to see how this applies to your home? We can model it for you.</p>
    <p><a href="{{BOOKING_LINK}}">Book a time</a> or reply to this email with your bill amount.</p>
  </div>
  `,

  caseStudyHTML: (_: EmailTemplateParams) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
    <h2>Case Study: Emily in Phoenix</h2>
    <ul>
      <li>Bill before solar: $210/month</li>
      <li>Bill after solar: $56/month</li>
      <li><strong>Annual savings: $1,840</strong></li>
    </ul>
    <p>Every home is different. Let's run your numbers and show your exact savings.</p>
    <p><a href="{{BOOKING_LINK}}">See your savings</a></p>
  </div>
  `,

  finalCTAHTML: ({ leadName }: EmailTemplateParams) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
    <h2>Hi ${leadName}, last chance to lock incentives this month</h2>
    <p>We only have a few consultation slots left. If you're considering solar, now's a great time to see your exact savings.</p>
    <p>
      <a href="{{BOOKING_LINK}}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Book Free Consultation</a>
    </p>
    <p style="color:#555">Takes 15 minutes. No obligation.</p>
  </div>
  `,

  appointmentConfirmHTML: ({ leadName }: EmailTemplateParams, date: string, time: string, dial: string) => `
  <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
    <h2>You're booked, ${leadName}!</h2>
    <p>Your solar consultation is confirmed for <strong>${date}</strong> at <strong>${time}</strong>.</p>
    <p>We'll reach you at <strong>${dial}</strong>. Reply if you need to reschedule.</p>
  </div>
  `,
};
