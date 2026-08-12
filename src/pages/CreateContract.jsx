import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateContractWizard from "../components/CreateContractWizard";
import ContractsV3 from "./ContractsV3";

const CreateContract = () => {
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(true);

  const handleClose = () => {
    setIsWizardOpen(false);
    navigate("/contracts");
  };

  const handleSuccess = () => {
    // Navigation is handled by CreateContractWizard
    // This callback is for any additional cleanup if needed
  };

  return (
    <>
      {/* Render contracts list in background */}
      <div className="pointer-events-none">
        <ContractsV3 />
      </div>
      {/* Wizard overlay */}
      <CreateContractWizard
        isOpen={isWizardOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default CreateContract;