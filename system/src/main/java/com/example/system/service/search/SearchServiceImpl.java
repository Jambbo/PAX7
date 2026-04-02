package com.example.system.service.search;

import com.example.system.repository.GroupRepository;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.mapper.GroupMapper;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.search.GlobalSearchResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final PostRepository postRepository;

    private final UserMapper userMapper;
    private final GroupMapper groupMapper;
    private final PostMapper postMapper;

    @Override
    @Transactional(readOnly = true)
    public GlobalSearchResponseDto search(String query) {
        var users = userRepository.findTop5ByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query, query);
        var groups = groupRepository.findTop5ByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        var posts = postRepository.findTop5ByTextContainingIgnoreCase(query);

        return new GlobalSearchResponseDto(
                userMapper.toDto(users),
                groupMapper.toDto(groups),
                postMapper.toDto(posts)
        );
    }
}
