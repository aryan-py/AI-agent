
import { useParams, useNavigate } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";

const Chat = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  if (!leadId) {
    return <div>Lead not found</div>;
  }

  return (
    <ChatInterface 
      leadId={leadId} 
      onBack={handleBack}
    />
  );
};

export default Chat;
