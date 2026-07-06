package com.reportgenerator.repository;

import com.reportgenerator.model.Report;
import com.reportgenerator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    Optional<Report> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);
    List<Report> findByUserOrderByWeekStartDesc(User user);
    List<Report> findByWeekStart(LocalDate weekStart);

    @Query("SELECT r FROM Report r WHERE " +
           "(:userId IS NULL OR r.user.id = :userId) AND " +
           "(:projectId IS NULL OR r.project.id = :projectId) AND " +
           "(cast(:startDate as date) IS NULL OR r.weekStart >= :startDate) AND " +
           "(cast(:endDate as date) IS NULL OR r.weekStart <= :endDate) " +
           "ORDER BY r.weekStart DESC, r.submittedAt DESC")
    List<Report> findByFilters(
        @Param("userId") Long userId,
        @Param("projectId") Long projectId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
