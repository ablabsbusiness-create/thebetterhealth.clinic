(function enforceClinicAuth() {
  const hasSessionCookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .some((part) => part.startsWith('clinic_session=') && part.length > 'clinic_session='.length);

  if (hasSessionCookie) {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginPath = window.location.pathname.startsWith('/emr/kid/') || window.location.pathname === '/emr/kid'
    ? '/emr/kid/password.html'
    : '/password';

  window.location.replace(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
})();
