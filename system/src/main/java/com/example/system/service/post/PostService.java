package com.example.system.service.post;

import com.example.system.domain.model.Post;

import java.util.List;

public interface PostService {

    Post createPost(Post post, String ownerId);

    Post getPostById(Long id);

    List<Post> getAllPosts();

    Post updatePost(Long postId, Post post);

    void deletePost(Long id);

    List<Post> getPostsByAuthorId(String authorId);

    List<Post> getPostsByGroupId(Long groupId);

    List<Post> getTopPostsByViews();

    List<Post> getTopPostsByLikes();

    Post incrementViews(Long id);

    Post incrementLikesAndAddToUser(Long postId, String userId);

}
