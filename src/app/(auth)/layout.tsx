export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-semibold tracking-tight">Hogar</h1>
          <p className="text-sm text-muted-foreground">Tu hub doméstico compartido</p>
        </div>
        {children}
      </div>
    </div>
  );
}
