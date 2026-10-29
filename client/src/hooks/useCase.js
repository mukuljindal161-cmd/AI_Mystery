import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
export function useCase(result = false) {
  const { id } = useParams(),
    navigate = useNavigate();
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    (result ? api.result(id, controller.signal) : api.get(id, controller.signal))
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!result && response.case.status === 'completed')
          navigate(`/case/${id}/result`, { replace: true });
        else setData(result ? response.result : response.case);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err.code === 'CASE_NOT_COMPLETE')
          navigate(`/case/${id}`, {
            replace: true,
            state: { notice: 'Finish your investigation to reveal the solution.' },
          });
        else setError(err);
      });
    return () => controller.abort();
  }, [id, result, version, navigate]);
  return { id, data, setData, error, reload };
}
