import SettingGameSection from './components/SettingGameSection';

export default function SettingPage() {
  return (
    <div className="p-4 w-100 min-h-full bg-base-100 text-base-content overflow-y-auto">
      <div className="divider mt-0">General</div>
      <div className="divider">Game</div>
      <SettingGameSection />
    </div>
  );
}
