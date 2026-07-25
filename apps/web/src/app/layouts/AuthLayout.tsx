import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="nur-atmosphere flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
