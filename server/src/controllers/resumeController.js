import axios from "axios";

export const searchParsedResumes = async(req,res) => {
  try {
    const { skill } = req.query;

    const response = await axios.get(
      `http://127.0.0.1:8001/search?skill=${skill}`
    );

    res.json({
      success: true,
      data: response.data.data
    })
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch parsed resumes"
    })
  }
}
