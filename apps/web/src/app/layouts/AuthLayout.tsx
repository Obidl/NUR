import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="nur-atmosphere flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md nur-fade-in">
        <Outlet />
      </div>
    </div>
  );
}
