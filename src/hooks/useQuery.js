import { useQuery } from "@tanstack/react-query";
import api from "../api/api";

export const useFetchMyShortUrls = (token) => {
  return useQuery({
    queryKey: ["my-shortenurls"],
    queryFn: async () => {
      const { data } = await api.get("/api/urls/myurls", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    },
    select: (data) => {
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    staleTime: 5000,
  });
};

export const useFetchTotalClicks = (token) => {
  return useQuery({
    queryKey: ["url-totalclick"],
    queryFn: async () => {
      const { data } = await api.get(
        "/api/urls/totalClicks?startDate=2026-06-01&endDate=2026-07-30",
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return data;
    },

    // data.data =>
    //  {
    //     "2024-01-01": 120,
    //     "2024-01-02": 95,
    //     "2024-01-03": 110,
    //   };

    select: (data) => {
      return Object.keys(data).map((key) => ({
        clickDate: key,
        count: data[key],
      }));
    },

    // Object.keys(data.data) => ["2024-01-01", "2024-01-02", "2024-01-03"]

    // FINAL:
    //   [
    //     { clickDate: "2024-01-01", count: 120 },
    //     { clickDate: "2024-01-02", count: 95 },
    //     { clickDate: "2024-01-03", count: 110 },
    //   ]

    staleTime: 5000,
    enabled: !!token,
  });
};
