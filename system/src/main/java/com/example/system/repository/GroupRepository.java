package com.example.system.repository;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.GroupPrivacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);

    List<Group> findByOwnerId(String ownerId);

    List<Group> findByPrivacy(GroupPrivacy privacy);

    boolean existsByName(String name);

    boolean existsByIdAndOwnerId(Long groupId, String currentUserId);

    List<Group> findByMembers_Id(String userId);

    @Query("""
       SELECT g
       FROM Group g
       WHERE NOT EXISTS (
           SELECT 1
           FROM g.members m
           WHERE m.id = :userId
       )
       """)
    List<Group> findGroupsUserNotMemberOf(String userId);
}
