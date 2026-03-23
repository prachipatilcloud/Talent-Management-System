import API from "@/api/axios";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";



const PRIMARY = '#3b4eba';

const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';


const Dashboard = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});

   useEffect(() => {
    const fetchData = async () => {
      try {

        const [candidateRes, statsRes] = await Promise.all([
          API.get('/candidates?limit=100&sortby=newest'),
          API.get('/candidates?stats/status-counts'),
        ]);
        setCandidates(candidateRes.data.candidates || []);
        setStatusCounts(statsRes.data.statusCounts || {});
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() -7*24*60*60*1000);

  // total candidate in system
  const totalCandidates = candidates.length;

  // active interviews today = candidates with Interviewing status
  // who have a round scheduled today

  const activeInterviewsToday = candidates.filter(c => 
    c.interviewRounds?.some(r => {
      const d = new Date(r.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
  ).length;



  return (
    <div>Dashboard</div>
  )
}

export default Dashboard