import SettingGameSection from './components/SettingGameSection';
import SettingGeneralSection from './components/SettingGeneralSection';

export default function SettingPage() {
  return (
    <div className="p-4 w-[450px] min-h-full bg-base-100 text-base-content overflow-y-auto">
      <div className="divider mt-0">General</div>
      <SettingGeneralSection />
      <div className="divider">Game</div>
      <SettingGameSection />
    </div>
  );
}
