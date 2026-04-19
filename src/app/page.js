import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import WhyUs from '@/components/WhyUs';
import HowItWorks from '@/components/HowItWorks';
import Benefits from '@/components/Benefits';
import Therapists from '@/components/Therapists';
import Services from '@/components/Services';
import BookingCta from '@/components/BookingCta';
import { Partners, CtaBanner, Blog, Faq, Contact, Footer } from '@/components/SharedComponents';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Partners />
      <WhyUs />
      <HowItWorks />
      <Benefits />
      <Therapists />
      <Services />
       <BookingCta />
      <CtaBanner />
      <Blog />
      <Faq />
      <Contact />
      <Footer />
    </main>
  );
}