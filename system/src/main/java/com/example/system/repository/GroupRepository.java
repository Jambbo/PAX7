package com.example.system.repository;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.GroupPrivacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("""
       SELECT g FROM Group g 
       WHERE (LOWER(g.name) LIKE LOWER(CONCAT('%', :name, '%')) 
           OR LOWER(g.description) LIKE LOWER(CONCAT('%', :description, '%'))) 
       AND g.privacy <> com.example.system.domain.model.GroupPrivacy.WALL
       ORDER BY g.id ASC
       LIMIT 5
       """)
    List<Group> findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            @Param("name") String name,
            @Param("description") String description);

    List<Group> findByOwnerId(String ownerId);

    List<Group> findByPrivacy(GroupPrivacy privacy);

    boolean existsByName(String name);

    boolean existsByIdAndOwnerId(Long groupId, String currentUserId);

    @Query("SELECT g FROM Group g JOIN g.members m WHERE g.privacy <> com.example.system.domain.model.GroupPrivacy.WALL AND m.id = :userId")
    List<Group> findByMembers_Id(String userId);

    @Query("""
       SELECT g
       FROM Group g
       WHERE g.privacy <> com.example.system.domain.model.GroupPrivacy.WALL AND NOT EXISTS (
           SELECT 1
           FROM g.members m
           WHERE m.id = :userId
       )
       """)
    List<Group> findGroupsUserNotMemberOf(String userId);

    @Query("SELECT g FROM Group g WHERE g.privacy <> com.example.system.domain.model.GroupPrivacy.WALL")
    List<Group> findAllVisibleGroups();
}
