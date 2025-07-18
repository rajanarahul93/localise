import { Modal } from "./ui/Modal";
import { CreatePostForm } from "./CreatePostForm";
import type { Location } from "../types";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: Location;
}

export function CreatePostModal({
  isOpen,
  onClose,
  userLocation,
}: CreatePostModalProps) {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Post">
      <CreatePostForm
        userLocation={userLocation}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
