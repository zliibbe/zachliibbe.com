
export default function scrollToTop() {
  let isBrowser = () => typeof window !== 'undefined'; 

    if (!isBrowser()) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}