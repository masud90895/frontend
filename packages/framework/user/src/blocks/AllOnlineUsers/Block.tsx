/**
 * @type: block
 * name: user.block.allOnlineUsers
 * title: All Online Users
 * keywords: user
 * description: Display All Online Users link
 * thumbnail:
 */
import { BlockViewProps } from '@metafox/framework';
import { Block, BlockContent, BlockHeader } from '@metafox/layout';
import { Box } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Props extends BlockViewProps {}

export default function AllOnlineUsersBlock(props: Props) {
  const navigate = useNavigate();

  const handleAllOnlineUsersClick = () => {
    navigate('/user');
  };

  return (
    <Block testid="blockAllOnlineUsers">
      <BlockHeader>
        <Box
          component="a"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            handleAllOnlineUsersClick();
          }}
          sx={{
            textDecoration: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            '&:hover': {
              textDecoration: 'underline'
            },
            marginTop: '10px'
          }}
        >
          All Online Users
        </Box>
      </BlockHeader>
      <BlockContent />
    </Block>
  );
}
