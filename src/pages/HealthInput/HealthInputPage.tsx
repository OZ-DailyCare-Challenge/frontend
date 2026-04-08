import "./HealthInputPage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createHealthRecord, requestHealthAnalysis } from "../../api/health";
import {
  initializeUserProfile,
  updateUserProfile,
} from "../../api/user";
import { storage } from "../../utils/storage";

type FormDataType = {
  nickname: string;
  birthYear: string;
  gender: string;
  height: string;
  weight: string;
  systolic: string;
  diastolic: string;
  glucose: string;
  cholesterol: string;
  smokingFrequency: string;
  drinkingFrequency: string;
  exerciseFrequency: string;
};

const HealthInputPage = () => {
  const navigate = useNavigate();

  const [smoking, setSmoking] = useState<boolean | null>(null);
  const [drinking, setDrinking] = useState<boolean | null>(null);
  const [exercise, setExercise] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormDataType>({
    nickname: "",
    birthYear: "",
    gender: "",
    height: "",
    weight: "",
    systolic: "",
    diastolic: "",
    glucose: "",
    cholesterol: "",
    smokingFrequency: "",
    drinkingFrequency: "",
    exerciseFrequency: "",
  });

  useEffect(() => {
    if (
      storage.isLoggedIn() &&
      storage.hasHealthInput() &&
      storage.hasAnalysisResult()
    ) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleInputChange = (key: keyof FormDataType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.nickname ||
      !formData.birthYear ||
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.systolic ||
      !formData.diastolic ||
      !formData.glucose ||
      !formData.cholesterol
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return false;
    }

    if (smoking === null || drinking === null || exercise === null) {
      alert("생활습관 항목을 모두 선택해주세요.");
      return false;
    }

    if (smoking === true && !formData.smokingFrequency) {
      alert("흡연 빈도를 선택해주세요.");
      return false;
    }

    if (drinking === true && !formData.drinkingFrequency) {
      alert("음주 빈도를 선택해주세요.");
      return false;
    }

    if (exercise === true && !formData.exerciseFrequency) {
      alert("운동 빈도를 선택해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const birthYear = Number(formData.birthYear);

    const initialProfilePayload = {
      nickname: formData.nickname,
      gender: formData.gender as "M" | "F",
      birth_year: birthYear,
    };

    const updateProfilePayload = {
      nickname: formData.nickname,
      birth_year: birthYear,
    };

    const apiPayload = {
      systolic_bp: Number(formData.systolic),
      diastolic_bp: Number(formData.diastolic),
      total_cholesterol: Number(formData.cholesterol),
      glucose: Number(formData.glucose),
      height: Number(formData.height),
      weight: Number(formData.weight),
      smoke_yn: smoking === true,
      alcohol_yn: drinking === true,
      exercise_yn: exercise === true,
    };

    const healthDataForUI = {
      nickname: formData.nickname,
      birth_year: birthYear,
      gender: formData.gender,
      height: Number(formData.height),
      weight: Number(formData.weight),
      systolic: Number(formData.systolic),
      diastolic: Number(formData.diastolic),
      glucose: Number(formData.glucose),
      cholesterol: Number(formData.cholesterol),
      smoking,
      drinking,
      exercise,
      smokingFrequency: formData.smokingFrequency || null,
      drinkingFrequency: formData.drinkingFrequency || null,
      exerciseFrequency: formData.exerciseFrequency || null,
    };

    try {
      setIsSubmitting(true);

      const currentUser = storage.getUser();
      const hasGender = !!currentUser?.gender;

      if (!hasGender) {
        try {
          await initializeUserProfile(initialProfilePayload);
        } catch (error: any) {
          if (error?.response?.status === 409) {
            console.log("초기 프로필이 이미 존재해서 update profile로 진행합니다.");
            await updateUserProfile(updateProfilePayload);
          } else {
            throw error;
          }
        }
      } else {
        await updateUserProfile(updateProfilePayload);
      }

      const recordResponse = await createHealthRecord(apiPayload);

      const recordId =
        recordResponse?.record_id ??
        recordResponse?.id ??
        recordResponse?.data?.record_id ??
        recordResponse?.data?.id;

      if (!recordId) {
        throw new Error("record_id를 찾을 수 없습니다.");
      }

      const analysisResponse = await requestHealthAnalysis(recordId);

      const taskId =
        analysisResponse?.task_id ??
        analysisResponse?.id ??
        analysisResponse?.data?.task_id ??
        analysisResponse?.data?.id;

      if (!taskId) {
        throw new Error("task_id를 찾을 수 없습니다.");
      }

      if (currentUser) {
        storage.setUser({
          ...currentUser,
          nickname: formData.nickname,
          birth_year: birthYear,
          gender: currentUser.gender ?? formData.gender,
        });
      }

      storage.setHealthData(healthDataForUI);
      storage.setHealthRecordId(recordId);
      storage.setAnalysisTaskId(taskId);

      navigate("/analysis-loading", {
        state: { taskId },
      });

    } catch (error: any) {
      console.error("건강 분석 요청 실패:", error);

      const detailMessage =
        error?.response?.data?.detail ||
        "분석 요청에 실패했습니다. 잠시 후 다시 시도해주세요.";

      alert(detailMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="health-input-page">
      <div className="health-input-container">
        <div className="health-input-header">
          <p className="health-input-badge">건강 데이터 입력</p>
          <h1 className="health-input-title">건강검진 정보를 입력해주세요</h1>
          <p className="health-input-desc">
            기본 건강 수치와 생활습관 정보를 입력하면 결과를 분석해드려요.
          </p>
        </div>

        <div className="checkup-card">
          <div className="habit-section">
            <h2 className="section-title">기본 정보</h2>

            <div className="checkup-grid">
              <div className="input-group">
                <label>닉네임</label>
                <input
                  type="text"
                  placeholder="사용하실 닉네임을 입력하세요."
                  value={formData.nickname}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>출생연도</label>
                <input
                  type="number"
                  placeholder="예: 1996"
                  value={formData.birthYear}
                  onChange={(e) =>
                    handleInputChange("birthYear", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <label>성별</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  <option value="F">여성</option>
                  <option value="M">남성</option>
                </select>
              </div>

              <div className="input-group">
                <label>신장(cm)</label>
                <input
                  type="number"
                  placeholder="예: 175"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>체중(kg)</label>
                <input
                  type="number"
                  placeholder="예: 80"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="habit-section">
            <h2 className="section-title">건강 검진 수치</h2>

            <div className="checkup-grid">
              <div className="input-group">
                <label>수축기 혈압(mmHg)</label>
                <input
                  type="number"
                  placeholder="예: 120"
                  value={formData.systolic}
                  onChange={(e) => handleInputChange("systolic", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>이완기 혈압(mmHg)</label>
                <input
                  type="number"
                  placeholder="예: 80"
                  value={formData.diastolic}
                  onChange={(e) => handleInputChange("diastolic", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>공복 혈당(mg/dL)</label>
                <input
                  type="number"
                  placeholder="예: 95"
                  value={formData.glucose}
                  onChange={(e) => handleInputChange("glucose", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>총 콜레스테롤(mg/dL)</label>
                <input
                  type="number"
                  placeholder="예: 180"
                  value={formData.cholesterol}
                  onChange={(e) =>
                    handleInputChange("cholesterol", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="habit-section">
            <h2 className="section-title">생활습관 정보</h2>

            <div className="habit-grid">
              <div className="habit-item">
                <label>흡연 여부</label>

                <div className="option-row">
                  <button
                    type="button"
                    className={`option-btn ${smoking === true ? "active" : ""}`}
                    onClick={() => setSmoking(true)}
                  >
                    예
                  </button>

                  <button
                    type="button"
                    className={`option-btn ${smoking === false ? "active" : ""}`}
                    onClick={() => {
                      setSmoking(false);
                      handleInputChange("smokingFrequency", "");
                    }}
                  >
                    아니오
                  </button>
                </div>

                {smoking === true && (
                  <select
                    value={formData.smokingFrequency}
                    onChange={(e) =>
                      handleInputChange("smokingFrequency", e.target.value)
                    }
                  >
                    <option value="">흡연 빈도 선택</option>
                    <option value="주 1~2회">주 1~2회</option>
                    <option value="주 3~6회">주 3~6회</option>
                    <option value="매일">매일</option>
                  </select>
                )}
              </div>

              <div className="habit-item">
                <label>음주 여부</label>

                <div className="option-row">
                  <button
                    type="button"
                    className={`option-btn ${drinking === true ? "active" : ""}`}
                    onClick={() => setDrinking(true)}
                  >
                    예
                  </button>

                  <button
                    type="button"
                    className={`option-btn ${drinking === false ? "active" : ""}`}
                    onClick={() => {
                      setDrinking(false);
                      handleInputChange("drinkingFrequency", "");
                    }}
                  >
                    아니오
                  </button>
                </div>

                {drinking === true && (
                  <select
                    value={formData.drinkingFrequency}
                    onChange={(e) =>
                      handleInputChange("drinkingFrequency", e.target.value)
                    }
                  >
                    <option value="">음주 빈도 선택</option>
                    <option value="주 1회">주 1회</option>
                    <option value="주 2~3회">주 2~3회</option>
                    <option value="주 4회 이상">주 4회 이상</option>
                  </select>
                )}
              </div>

              <div className="habit-item">
                <label>운동 여부</label>

                <div className="option-row">
                  <button
                    type="button"
                    className={`option-btn ${exercise === true ? "active" : ""}`}
                    onClick={() => setExercise(true)}
                  >
                    예
                  </button>

                  <button
                    type="button"
                    className={`option-btn ${exercise === false ? "active" : ""}`}
                    onClick={() => {
                      setExercise(false);
                      handleInputChange("exerciseFrequency", "");
                    }}
                  >
                    아니오
                  </button>
                </div>

                {exercise === true && (
                  <select
                    value={formData.exerciseFrequency}
                    onChange={(e) =>
                      handleInputChange("exerciseFrequency", e.target.value)
                    }
                  >
                    <option value="">운동 빈도 선택</option>
                    <option value="주 1~2회">주 1~2회</option>
                    <option value="주 3~4회">주 3~4회</option>
                    <option value="주 5회 이상">주 5회 이상</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="checkup-action">
            <button
              className="analyze-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "분석 중..." : "분석하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthInputPage;