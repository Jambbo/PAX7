package com.example.system.repository;

import com.example.system.domain.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findTop5ByTextContainingIgnoreCase(String text);

    List<Post> findByAuthorId(String authorId);

    List<Post> findByGroupId(Long groupId);

    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId ORDER BY p.createdAt DESC")
    List<Post> findByAuthorIdOrderByCreatedAtDesc(@Param("authorId") String authorId);

    @Query("SELECT p FROM Post p WHERE p.group.id = :groupId ORDER BY p.createdAt DESC")
    List<Post> findByGroupIdOrderByCreatedAtDesc(@Param("groupId") Long groupId);

    @Query("SELECT p FROM Post p WHERE p.group IS NULL OR p.group.privacy <> com.example.system.domain.model.GroupPrivacy.WALL ORDER BY p.views DESC")
    List<Post> findTopByViews();

    @Query("SELECT p FROM Post p WHERE p.group IS NULL OR p.group.privacy <> com.example.system.domain.model.GroupPrivacy.WALL ORDER BY p.likes DESC")
    List<Post> findTopByLikes();

    @Query("SELECT p FROM Post p WHERE p.group IS NULL OR p.group.privacy <> com.example.system.domain.model.GroupPrivacy.WALL ORDER BY p.createdAt DESC")
    List<Post> findAllVisiblePosts();

    boolean existsByIdAndAuthorId(Long postId, String currentUserId);

    boolean existsByIdAndGroupOwnerId(Long postId, String currentUserId);
}
