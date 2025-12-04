import Modal from "./Modal";
import Sidebar from "./SideBar";
import ApiTabs from "./ApiTabs";
import GoogleTab from "./GoogleTabs";
import Footer from "./Footer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full">

        {/* sidebar */}
        <Sidebar />

        {/* conteúdo */}
        <div className="flex-1 flex flex-col bg-neutral-900">
          <ApiTabs />
          <GoogleTab />
        </div>

        <Footer/>

      </div>
    </Modal>
  );
}

