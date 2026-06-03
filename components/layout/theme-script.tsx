"use client";

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('fintrack-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
      }}
    />
  );
}
