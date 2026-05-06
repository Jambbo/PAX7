package com.example.system.service;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.repository.GroupRepository;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.group.GroupReadResponseDto;
import com.example.system.rest.dto.mapper.GroupMapper;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.search.GlobalSearchResponseDto;
import com.example.system.rest.dto.user.UserReadResponseDto;
import com.example.system.service.search.SearchServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
public class SearchServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserMapper userMapper;
    @Mock private GroupMapper groupMapper;
    @Mock private PostMapper postMapper;

    @InjectMocks
    private SearchServiceImpl searchService;

    @Test
    @DisplayName("Test global search returns users, groups and posts matching the query")
    public void givenQuery_whenSearch_thenReturnMatchingResultsInAllCategories() {
        // Given
        String query = "java";

        List<User> users = List.of(new User());
        List<Group> groups = List.of(new Group());
        List<Post> posts = List.of(new Post());

        List<UserReadResponseDto> userDtos = List.of(mock(UserReadResponseDto.class));
        List<GroupReadResponseDto> groupDtos = List.of(mock(GroupReadResponseDto.class));
        List<PostReadResponseDto> postDtos = List.of(mock(PostReadResponseDto.class));

        given(userRepository.findTop5ByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query, query))
                .willReturn(users);
        given(groupRepository.findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query))
                .willReturn(groups);
        given(postRepository.findTop5ByTextContainingIgnoreCase(query))
                .willReturn(posts);
        given(userMapper.toDto(users)).willReturn(userDtos);
        given(groupMapper.toDto(groups)).willReturn(groupDtos);
        given(postMapper.toDto(posts)).willReturn(postDtos);

        // When
        GlobalSearchResponseDto result = searchService.search(query);

        // Then
        assertNotNull(result);
        assertEquals(1, result.users().size());
        assertEquals(1, result.groups().size());
        assertEquals(1, result.posts().size());
        then(userRepository).should()
                .findTop5ByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query, query);
        then(groupRepository).should()
                .findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        then(postRepository).should()
                .findTop5ByTextContainingIgnoreCase(query);
    }

    @Test
    @DisplayName("Test global search with no matches returns empty lists")
    public void givenQueryWithNoMatches_whenSearch_thenReturnEmptyLists() {
        // Given
        String query = "xyznotfound";
        List<User> emptyUsers = List.of();
        List<Group> emptyGroups = List.of();
        List<Post> emptyPosts = List.of();

        given(userRepository.findTop5ByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query, query))
                .willReturn(emptyUsers);
        given(groupRepository.findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query))
                .willReturn(emptyGroups);
        given(postRepository.findTop5ByTextContainingIgnoreCase(query))
                .willReturn(emptyPosts);
        given(userMapper.toDto(emptyUsers)).willReturn(List.of());
        given(groupMapper.toDto(emptyGroups)).willReturn(List.of());
        given(postMapper.toDto(emptyPosts)).willReturn(List.of());

        // When
        GlobalSearchResponseDto result = searchService.search(query);

        // Then
        assertNotNull(result);
        assertEquals(0, result.users().size());
        assertEquals(0, result.groups().size());
        assertEquals(0, result.posts().size());
    }
}
