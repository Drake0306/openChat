import { RedirectFallback } from '../../components/auth/redirect-fallback';

export default function AuthSuccessPage() {
  return (
    <>
      <meta httpEquiv="refresh" content="1; url=/chat" />
      <RedirectFallback to="/chat" delay={1000} />
    </>
  );
}