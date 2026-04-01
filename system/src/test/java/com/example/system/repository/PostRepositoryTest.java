package com.example.system.repository;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class PostRepositoryTest {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @BeforeEach
    public void setUp() {
        postRepository.deleteAll();
        groupRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Test find by author Id")
    public void givenPost_whenFindByAuthorId_thenReturnsAuthorPosts() {
        User author = UserUtils.getJohnDoe();
        userRepository.save(author);

        Post post = Post.builder().text("Hello World").author(author).build();
        postRepository.save(post);

        List<Post> found = postRepository.findByAuthorId(author.getId());
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getText()).isEqualTo("Hello World");
    }

    @Test
    @DisplayName("Test find by group Id")
    public void givenGroupPost_whenFindByGroupId_thenReturnsGroupPosts() {
        Group group = Group.builder().name("Test Group").build();
        groupRepository.save(group);

        Post post = Post.builder().text("Group Post").group(group).build();
        postRepository.save(post);

        List<Post> found = postRepository.findByGroupId(group.getId());
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getText()).isEqualTo("Group Post");
    }

    @Test
    @DisplayName("Test find by author Id ordered by created at desc")
    public void givenPosts_whenFindByAuthorIdOrderByCreatedAtDesc_thenReturnsOrderedPosts() throws InterruptedException {
        User author = UserUtils.getJohnDoe();
        userRepository.save(author);

        Post olderPost = Post.builder().text("Older").author(author).build();
        postRepository.save(olderPost);
        
        Thread.sleep(100); // ensure timestamp difference

        Post newerPost = Post.builder().text("Newer").author(author).build();
        postRepository.save(newerPost);

        List<Post> found = postRepository.findByAuthorIdOrderByCreatedAtDesc(author.getId());
        assertThat(found).hasSize(2);
        assertThat(found.getFirst().getText()).isEqualTo("Newer");
        assertThat(found.get(1).getText()).isEqualTo("Older");
    }

    @Test
    @DisplayName("Test find by group Id ordered by created at desc")
    public void givenPosts_whenFindByGroupIdOrderByCreatedAtDesc_thenReturnsOrderedPosts() throws InterruptedException {
        Group group = Group.builder().name("Group").build();
        groupRepository.save(group);

        Post olderPost = Post.builder().text("Older").group(group).build();
        postRepository.save(olderPost);

        Thread.sleep(100);

        Post newerPost = Post.builder().text("Newer").group(group).build();
        postRepository.save(newerPost);

        List<Post> found = postRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());
        assertThat(found).hasSize(2);
        assertThat(found.getFirst().getText()).isEqualTo("Newer");
    }

    @Test
    @DisplayName("Test find top descending by views")
    public void givenPosts_whenFindTopByViews_thenReturnsOrderedByViews() {
        Post lessViews = Post.builder().views(10L).build();
        Post moreViews = Post.builder().views(100L).build();
        postRepository.save(lessViews);
        postRepository.save(moreViews);

        List<Post> found = postRepository.findTopByViews();
        assertThat(found).hasSize(2);
        assertThat(found.getFirst().getViews()).isEqualTo(100L);
    }

    @Test
    @DisplayName("Test find top descending by likes")
    public void givenPosts_whenFindTopByLikes_thenReturnsOrderedByLikes() {
        Post lessLikes = Post.builder().likes(5L).build();
        Post moreLikes = Post.builder().likes(50L).build();
        postRepository.save(lessLikes);
        postRepository.save(moreLikes);

        List<Post> found = postRepository.findTopByLikes();
        assertThat(found).hasSize(2);
        assertThat(found.getFirst().getLikes()).isEqualTo(50L);
    }

    @Test
    @DisplayName("Test exists by Id and author Id")
    public void givenAuthorPost_whenExistsByIdAndAuthorId_thenReturnsTrue() {
        User author = UserUtils.getJohnDoe();
        userRepository.save(author);

        Post post = Post.builder().text("Content").author(author).build();
        postRepository.save(post);

        assertThat(postRepository.existsByIdAndAuthorId(post.getId(), author.getId())).isTrue();
        assertThat(postRepository.existsByIdAndAuthorId(post.getId(), "wrong_user")).isFalse();
    }
}
