'use client';

import { Phone } from 'lucide-react';
import { WHATSAPP_URL } from './constants';
import { WhatsAppIcon } from './ui';

// call and WhatsApp buttons that stay in the bottom-right corner while the page scrolls
export default function FloatingContact() {
  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8">
      <a href="tel:+919918878550" aria-label="Call us" className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white shadow-[0_12px_30px_-10px_rgb(220_38_38)] transition hover:-translate-y-0.5 hover:bg-red-700 sm:h-14 sm:w-14">
        <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Message us on WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-10px_rgb(37_211_102)] transition hover:-translate-y-0.5 hover:brightness-95 sm:h-14 sm:w-14">
        <WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7" />
      </a>
    </div>
  );
}
